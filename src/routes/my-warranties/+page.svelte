<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { ShieldCheck, ChevronLeft, CheckCircle2, Loader2, Wallet, Send, Calendar, Hash, Package, ShieldAlert } from '@lucide/svelte';
  import { web3State } from "$lib/web3.svelte";
  import { readContract, writeContract, waitForTransactionReceipt, getPublicClient } from '@wagmi/core';
  import { config } from '$lib/wagmi';
  import { sepolia } from '@wagmi/core/chains';
  import { parseAbiItem } from 'viem';
  import WarrantyNFTAbi from '../../abi/WarrantyNFT.json';
  import axios from 'axios';

  interface WarrantyItem {
    tokenId: string;
    productId: string;
    serialNumber: string;
    activationDate: string;
    expiryDate: string;
    isActive: boolean;
    metadata: any;
    // UI state for transferring this card
    showTransferInput: boolean;
    recipientAddress: string;
    isTransferring: boolean;
    transferError: string;
  }

  let warranties = $state<WarrantyItem[]>([]);
  let isLoading = $state(false);
  let errorMsg = $state("");

  // Track wallet address and load warranties reactively
  $effect(() => {
    if (web3State.isConnected && web3State.address) {
      loadWarranties(web3State.address);
    } else {
      warranties = [];
      errorMsg = "";
    }
  });

  async function loadWarranties(userAddress: string) {
    isLoading = true;
    errorMsg = "";
    warranties = [];

    try {
      // Step 1: Query balanceOf to bypass logs search if balance is zero
      const balance = await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`]
      }) as bigint;

      if (balance === 0n) {
        warranties = [];
        isLoading = false;
        return;
      }

      const publicClient = getPublicClient(config, { chainId: sepolia.id });
      
      // Step 2: Query all Transfer event logs where userAddress is the recipient ('to')
      // Deployed block is 11215945 on Sepolia. We scan from 11215900n to reduce query block range size.
      const logs = await publicClient.getLogs({
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
        args: {
          to: userAddress as `0x${string}`
        },
        fromBlock: 11215900n
      });

      // Step 3: Extract unique token IDs
      const uniqueTokenIds = [...new Set(logs.map(log => log.args.tokenId))];
      const items: WarrantyItem[] = [];

      // Step 3: Query contract for each token to verify current ownership and load details
      for (const tokenId of uniqueTokenIds) {
        if (tokenId === undefined) continue;

        try {
          const currentOwner = await readContract(config, {
            chainId: sepolia.id,
            address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
            abi: WarrantyNFTAbi,
            functionName: 'ownerOf',
            args: [tokenId]
          }) as `0x${string}`;

          // Only show if the user is still the owner
          if (currentOwner.toLowerCase() === userAddress.toLowerCase()) {
            const details = await readContract(config, {
              chainId: sepolia.id,
              address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
              abi: WarrantyNFTAbi,
              functionName: 'getWarrantyDetails',
              args: [tokenId]
            }) as any;

            const details_productId = details.productId !== undefined ? details.productId : details[0];
            const details_serialNumber = details.serialNumber !== undefined ? details.serialNumber : details[1];
            const details_activationTime = details.activationTime !== undefined ? details.activationTime : details[2];
            const details_duration = details.duration !== undefined ? details.duration : details[3];

            const isActive = await readContract(config, {
              chainId: sepolia.id,
              address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
              abi: WarrantyNFTAbi,
              functionName: 'isWarrantyActive',
              args: [tokenId]
            }) as boolean;

            const uri = await readContract(config, {
              chainId: sepolia.id,
              address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
              abi: WarrantyNFTAbi,
              functionName: 'tokenURI',
              args: [tokenId]
            }) as string;

            let metadata: any = null;
            if (uri) {
              const gatewayUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
              try {
                const response = await axios.get(gatewayUrl, { timeout: 8000 });
                metadata = response.data;
              } catch (ipfsErr) {
                console.error(`Failed to fetch IPFS metadata for token #${tokenId}:`, ipfsErr);
              }
            }

            const activationDate = new Date(Number(details_activationTime) * 1000);
            let expiryDate: Date;
            if (Number(details_duration) > 1000) {
              expiryDate = new Date((Number(details_activationTime) + Number(details_duration)) * 1000);
            } else {
              expiryDate = new Date(activationDate.getTime());
              expiryDate.setMonth(expiryDate.getMonth() + Number(details_duration));
            }

            items.push({
              tokenId: tokenId.toString(),
              productId: details_productId,
              serialNumber: details_serialNumber,
              activationDate: activationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              expiryDate: expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              isActive,
              metadata,
              showTransferInput: false,
              recipientAddress: "",
              isTransferring: false,
              transferError: ""
            });
          }
        } catch (tokenErr) {
          console.error(`Failed to read contract details for token #${tokenId}:`, tokenErr);
        }
      }

      warranties = items;
    } catch (err: any) {
      console.error(err);
      errorMsg = "Failed to load warranties from the blockchain: " + (err.message || "Please refresh or try again.");
    } finally {
      isLoading = false;
    }
  }

  async function handleTransfer(item: WarrantyItem) {
    if (!item.recipientAddress || !item.recipientAddress.startsWith("0x") || item.recipientAddress.length !== 42) {
      item.transferError = "Invalid recipient address.";
      return;
    }

    item.isTransferring = true;
    item.transferError = "";

    try {
      const hash = await writeContract(config, {
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'safeTransferFrom',
        args: [
          web3State.address as `0x${string}`,
          item.recipientAddress as `0x${string}`,
          BigInt(item.tokenId)
        ]
      });

      await waitForTransactionReceipt(config, { hash });

      // Successfully transferred, remove item from list
      warranties = warranties.filter(w => w.tokenId !== item.tokenId);
    } catch (err: any) {
      console.error(err);
      item.transferError = err.message || "Transfer failed. Check network or address.";
    } finally {
      item.isTransferring = false;
    }
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-hidden relative font-sans">
  <!-- Glowing background elements -->
  <div class="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"></div>

  <!-- Navbar -->
  <header class="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
    <a href="/" class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
      <ChevronLeft class="w-5 h-5" />
      <span class="font-medium">Back to Home</span>
    </a>
    <div class="flex items-center gap-2">
      <ShieldCheck class="w-6 h-6 text-indigo-400" />
      <span class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
        Warrant3
      </span>
    </div>
  </header>

  <!-- Content -->
  <main class="relative z-10 container mx-auto px-6 pt-16 pb-32">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 class="text-4xl font-extrabold tracking-tight mb-2">My Warranties</h1>
          <p class="text-slate-400">View and manage the active warranties tokenized in your Web3 wallet.</p>
        </div>
        
        <div class="shrink-0 flex items-center gap-3">
          {#if web3State.isConnected}
            <div class="bg-indigo-500/10 border border-indigo-500/25 px-4 py-2 rounded-xl text-indigo-300 text-sm font-mono flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {web3State.address?.slice(0, 6)}...{web3State.address?.slice(-4)}
            </div>
            <Button 
              onclick={() => web3State.disconnect()} 
              class="bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white hover:border-rose-500/50 rounded-xl px-4 py-2 transition-all"
            >
              Disconnect
            </Button>
          {:else}
            <Button onclick={() => web3State.connect()} class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] border-none">
              Connect Wallet
            </Button>
          {/if}
        </div>
      </div>

      {#if !web3State.isConnected}
        <!-- Disconnected State -->
        <div class="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl p-8 backdrop-blur-sm max-w-xl mx-auto shadow-2xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
          <div class="relative z-10 space-y-6">
            <div class="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Wallet class="w-8 h-8" />
            </div>
            <h3 class="text-2xl font-bold text-white">Connect Your Wallet</h3>
            <p class="text-slate-400 max-w-md mx-auto leading-relaxed">
              Connect your Web3 compatible wallet (e.g. MetaMask) to query the blockchain and display all tokenized warranties you own.
            </p>
            <Button onclick={() => web3State.connect()} disabled={web3State.isConnecting} class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 px-8 h-auto text-base font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] border-none">
              {#if web3State.isConnecting}
                <Loader2 class="w-4 h-4 animate-spin mr-2 inline" />
                Connecting Wallet...
              {:else}
                Connect Wallet
              {/if}
            </Button>
          </div>
        </div>
      {:else if isLoading}
        <!-- Loading State -->
        <div class="text-center py-24 space-y-4">
          <Loader2 class="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
          <p class="text-slate-400 font-medium">Scanning blockchain for your warranties...</p>
        </div>
      {:else if errorMsg}
        <!-- Error State -->
        <div class="text-center py-16 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-8 max-w-lg mx-auto space-y-4">
          <ShieldAlert class="w-12 h-12 text-rose-400 mx-auto" />
          <h3 class="text-lg font-bold text-white">Blockchain Query Error</h3>
          <p class="text-slate-400 text-sm">{errorMsg}</p>
          <Button onclick={() => loadWarranties(web3State.address!)} class="bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-6">
            Retry Search
          </Button>
        </div>
      {:else if warranties.length === 0}
        <!-- Empty State -->
        <div class="text-center py-20 bg-white/[0.01] border border-white/5 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl relative overflow-hidden">
          <div class="relative z-10 space-y-6">
            <div class="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center mx-auto text-slate-400">
              <Package class="w-8 h-8" />
            </div>
            <h3 class="text-2xl font-bold text-white">No Warranties Found</h3>
            <p class="text-slate-400 max-w-md mx-auto leading-relaxed">
              We couldn't find any Warranty NFTs associated with your wallet address. If you recently purchased a product, you can mint its warranty on-chain.
            </p>
            <Button href="/mint" class="bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl py-5 px-8 h-auto text-base font-semibold shadow-[0_0_20px_rgba(236,72,153,0.3)] border-none">
              Mint a Warranty
            </Button>
          </div>
        </div>
      {:else}
        <!-- Warranties Grid -->
        <div class="grid md:grid-cols-2 gap-8">
          {#each warranties as item (item.tokenId)}
            <div class="p-1 rounded-2xl bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent hover:from-indigo-500/20 hover:via-indigo-500/5 transition-all duration-300 border border-white/5 shadow-xl relative group flex flex-col">
              
              <!-- Expiry Status Badge -->
              <div class="absolute top-4 right-4 z-10">
                {#if item.isActive}
                  <span class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md">
                    Active
                  </span>
                {:else}
                  <span class="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-full backdrop-blur-md">
                    Expired
                  </span>
                {/if}
              </div>

              <!-- Thumbnail Image Container -->
              <div class="w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-white/5 relative flex items-center justify-center shrink-0">
                {#if item.metadata?.image}
                  <img 
                    src={item.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                    alt={item.productId} 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                {:else}
                  <Package class="w-12 h-12 text-slate-700" />
                {/if}
              </div>

              <!-- Product Details -->
              <div class="p-6 flex-1 flex flex-col justify-between">
                <div class="space-y-4">
                  <div class="flex justify-between items-start">
                    <h3 class="text-xl font-bold text-white leading-snug">{item.productId}</h3>
                    <span class="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      #{item.tokenId}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-y-3 text-sm border-t border-white/5 pt-4">
                    <div class="flex items-center gap-2 text-slate-400">
                      <Hash class="w-4 h-4 text-slate-500" />
                      <span>Serial Number</span>
                    </div>
                    <div class="text-white font-mono text-right font-medium truncate">{item.serialNumber}</div>

                    <div class="flex items-center gap-2 text-slate-400">
                      <Calendar class="w-4 h-4 text-slate-500" />
                      <span>Expiry Date</span>
                    </div>
                    <div class="text-white text-right font-medium">{item.expiryDate}</div>
                  </div>
                  
                  {#if item.metadata?.description}
                    <p class="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-4 mt-2">
                      {item.metadata.description}
                    </p>
                  {/if}
                </div>

                <!-- Transfer Actions -->
                <div class="border-t border-white/5 pt-6 mt-6 shrink-0">
                  {#if !item.showTransferInput}
                    <Button 
                      onclick={() => item.showTransferInput = true} 
                      class="w-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500/50 rounded-xl py-5 h-auto text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Send class="w-4 h-4" />
                      Transfer Warranty
                    </Button>
                  {:else}
                    <div class="space-y-3 animate-[fadeIn_0.2s_ease-out]">
                      <div class="text-xs font-semibold text-slate-400">Recipient Wallet Address</div>
                      <div class="flex gap-2">
                        <input 
                          type="text" 
                          bind:value={item.recipientAddress}
                          placeholder="0x..." 
                          class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                          required
                          disabled={item.isTransferring}
                        />
                        <Button 
                          onclick={() => handleTransfer(item)}
                          disabled={item.isTransferring}
                          class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 h-auto text-sm font-semibold"
                        >
                          {#if item.isTransferring}
                            <Loader2 class="w-4 h-4 animate-spin" />
                          {:else}
                            Send
                          {/if}
                        </Button>
                      </div>

                      {#if item.transferError}
                        <p class="text-xs text-rose-400 mt-1">{item.transferError}</p>
                      {/if}

                      <div class="flex justify-end gap-2 pt-1">
                        <button 
                          onclick={() => {
                            item.showTransferInput = false;
                            item.recipientAddress = "";
                            item.transferError = "";
                          }}
                          class="text-xs text-slate-400 hover:text-white transition-colors"
                          disabled={item.isTransferring}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>

              </div>

            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>
</div>
