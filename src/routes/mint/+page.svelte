<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { ShieldCheck, ChevronLeft, Hexagon, Layers, Key, ImagePlus, Loader2, Wallet } from '@lucide/svelte';
  import { web3State } from "$lib/web3.svelte";
  import { pinFileToIPFS, pinJSONToIPFS } from "$lib/pinata";
  import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
  import { config } from '$lib/wagmi';
  import { parseEventLogs } from 'viem';
  import WarrantyNFTAbi from '../../abi/WarrantyNFT.json';

  let file = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let fileName = $state("");
  let productName = $state("");
  let serialNumber = $state("");
  let duration = $state<number | null>(null);
  let customerWallet = $state("");

  let isMinting = $state(false);
  let statusText = $state("");
  let errorMsg = $state("");
  let mintHash = $state<string | null>(null);
  let mintedTokenId = $state<string | null>(null);

  // Auto fill customer wallet with connected address
  $effect(() => {
    if (web3State.isConnected && web3State.address && !customerWallet) {
      customerWallet = web3State.address;
    }
  });

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      file = target.files[0];
      fileName = file.name;
      previewUrl = URL.createObjectURL(file);
    }
  }

  async function handleMint(e: SubmitEvent) {
    e.preventDefault();
    if (!web3State.isConnected) {
      await web3State.connect();
      return;
    }

    if (!file) {
      errorMsg = "Please upload a warranty card thumbnail.";
      return;
    }
    if (!productName || !serialNumber || !duration || !customerWallet) {
      errorMsg = "Please fill in all fields.";
      return;
    }

    errorMsg = "";
    isMinting = true;
    mintHash = null;
    mintedTokenId = null;

    try {
      // Step 1: Upload image to IPFS
      statusText = "Uploading image to IPFS...";
      const imageMetadata = {
        name: `Warranty_${serialNumber}_image`,
        keyvalues: {
          productName,
          serialNumber
        }
      };
      const imageIpfsHash = await pinFileToIPFS(file, imageMetadata);
      const imageUrl = `ipfs://${imageIpfsHash}`;

      // Step 2: Upload Metadata JSON to IPFS
      statusText = "Uploading metadata to IPFS...";
      const metadata = {
        name: `Warranty NFT - ${productName}`,
        description: `Official blockchain-backed digital warranty for ${productName}.`,
        image: imageUrl,
        attributes: [
          { trait_type: "Product Name", value: productName },
          { trait_type: "Serial Number", value: serialNumber },
          { trait_type: "Duration (Months)", value: duration.toString() },
          { trait_type: "Issuer", value: web3State.address }
        ]
      };
      
      const jsonMetadata = {
        name: `Warranty_${serialNumber}_meta`,
        keyvalues: {
          productName,
          serialNumber
        }
      };
      const metadataIpfsHash = await pinJSONToIPFS(metadata, jsonMetadata);
      const metadataUrl = `ipfs://${metadataIpfsHash}`;

      // Step 3: Trigger contract mint
      statusText = "Please confirm minting transaction in your wallet...";
      
      const hash = await writeContract(config, {
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'mintWarranty',
        args: [
          customerWallet as `0x${string}`,
          metadataUrl,
          productName,
          serialNumber,
          BigInt(duration) * 2592000n // Convert months to seconds (30 days per month)
        ]
      });

      mintHash = hash;
      statusText = "Waiting for transaction confirmation...";

      const receipt = await waitForTransactionReceipt(config, { hash });

      // Step 4: Parse Token ID
      const logs = parseEventLogs({
        abi: WarrantyNFTAbi,
        eventName: 'WarrantyMinted',
        logs: receipt.logs,
      });

      if (logs && logs[0]) {
        const tokenIdVal = (logs[0] as any).args?.tokenId;
        if (tokenIdVal !== undefined) {
          mintedTokenId = tokenIdVal.toString();
          statusText = `🎉 Warranty NFT successfully minted! Token ID: #${mintedTokenId}`;
        } else {
          statusText = "🎉 Warranty NFT successfully minted!";
        }
      } else {
        statusText = "🎉 Warranty NFT successfully minted!";
      }

      // Reset form
      file = null;
      previewUrl = null;
      fileName = "";
      productName = "";
      serialNumber = "";
      duration = null;

    } catch (err: any) {
      console.error(err);
      errorMsg = err.message || "An error occurred during minting.";
      statusText = "";
    } finally {
      isMinting = false;
    }
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-50 selection:bg-pink-500/30 overflow-hidden relative font-sans">
  <!-- Glowing background elements -->
  <div class="absolute top-0 right-0 w-1/2 h-1/2 bg-pink-500/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

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
  <main class="relative z-10 container mx-auto px-6 pt-16 pb-32 grid lg:grid-cols-2 gap-16 items-center">
    
    <!-- Text/Info Side -->
    <div class="space-y-8">
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
        Mint a New <br/>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">
          Warranty NFT
        </span>
      </h1>
      <p class="text-slate-400 text-lg leading-relaxed max-w-md">
        Digitize your physical product warranties. By minting an NFT, you create an immutable, globally verifiable proof of ownership that lasts forever.
      </p>

      <div class="space-y-6 pt-4">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Hexagon class="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 class="font-semibold text-white mb-1">Decentralized Storage</h4>
            <p class="text-sm text-slate-400">Metadata is stored securely on IPFS.</p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Layers class="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 class="font-semibold text-white mb-1">Soulbound or Transferable</h4>
            <p class="text-sm text-slate-400">Choose if the warranty follows the user or the item.</p>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
            <Key class="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h4 class="font-semibold text-white mb-1">Cryptographic Proof</h4>
            <p class="text-sm text-slate-400">Unforgeable mathematical certainty of authenticity.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mint Form Side -->
    <div class="relative w-full max-w-lg mx-auto">
      <div class="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-indigo-500/20 rounded-3xl blur-xl transform scale-105 pointer-events-none"></div>
      
      <div class="relative bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-white mb-2">Warranty Details</h3>
          <p class="text-sm text-slate-400">Fill in the product details to generate the metadata.</p>
        </div>

        <form class="space-y-5" onsubmit={handleMint}>
          <!-- Image Upload -->
          <div>
            <label for="file-upload" class="block text-sm font-medium text-slate-300 mb-2">Warranty Card Thumbnail</label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-xl bg-white/[0.02] hover:bg-white/5 hover:border-indigo-500/50 transition-colors cursor-pointer group relative">
              <label for="file-upload" class="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"></label>
              <div class="space-y-1 text-center relative z-0">
                <input id="file-upload" name="file-upload" type="file" class="sr-only" accept="image/*" onchange={handleFileChange}>
                {#if previewUrl}
                  <img src={previewUrl} alt="Thumbnail Preview" class="mx-auto max-h-32 rounded-lg object-contain mb-2" />
                  <p class="text-sm text-indigo-400 font-medium">{fileName}</p>
                  <p class="text-xs text-slate-500">Click to change image</p>
                {:else}
                  <ImagePlus class="mx-auto h-12 w-12 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <div class="flex text-sm text-slate-400 justify-center">
                    <span class="relative font-medium text-indigo-400 hover:text-indigo-300">
                      Upload a file
                    </span>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                {/if}
              </div>
            </div>
          </div>

          <div>
            <label for="product_name" class="block text-sm font-medium text-slate-300 mb-2">Product Name</label>
            <input 
              id="product_name"
              type="text" 
              bind:value={productName}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
              placeholder="e.g. Asus ROG Strix G15"
              required
            />
          </div>

          <div>
            <label for="serial_number" class="block text-sm font-medium text-slate-300 mb-2">Serial Number</label>
            <input 
              id="serial_number"
              type="text" 
              bind:value={serialNumber}
              class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
              placeholder="e.g. SN-98234-XYZ"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="duration" class="block text-sm font-medium text-slate-300 mb-2">Duration (Months)</label>
              <input 
                id="duration"
                type="number" 
                bind:value={duration}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                placeholder="24"
                min="1"
                required
              />
            </div>
            <div>
              <label for="customer_wallet" class="block text-sm font-medium text-slate-300 mb-2">Customer Wallet Address</label>
              <input 
                id="customer_wallet"
                type="text" 
                bind:value={customerWallet}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                placeholder="0x..."
                required
              />
            </div>
          </div>

          {#if errorMsg}
            <div class="text-rose-400 text-sm text-center bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 rounded-xl">
              {errorMsg}
            </div>
          {/if}

          {#if statusText}
            <div class="text-indigo-300 text-sm text-center bg-indigo-500/10 border border-indigo-500/20 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2">
              {#if isMinting && !mintHash}
                <Loader2 class="w-4 h-4 animate-spin text-indigo-400" />
              {/if}
              <span>{statusText}</span>
            </div>
          {/if}

          {#if mintHash}
            <div class="text-xs text-center text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-white/5 space-y-1">
              <div class="font-medium text-white">Transaction Hash:</div>
              <a 
                href="https://sepolia.etherscan.io/tx/{mintHash}" 
                target="_blank" 
                rel="noreferrer"
                class="text-indigo-400 hover:underline break-all block font-mono"
              >
                {mintHash}
              </a>
            </div>
          {/if}

          <div class="pt-4">
            {#if !web3State.isConnected}
              <Button 
                type="button"
                onclick={() => web3State.connect()}
                disabled={web3State.isConnecting}
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 h-auto text-lg font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] border-none flex items-center justify-center gap-2"
              >
                <Wallet class="w-5 h-5" />
                {web3State.isConnecting ? 'Connecting Wallet...' : 'Connect Wallet to Mint'}
              </Button>
            {:else}
              <Button 
                type="submit"
                disabled={isMinting}
                class="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl py-6 h-auto text-lg font-semibold shadow-[0_0_20px_rgba(236,72,153,0.3)] border-none flex items-center justify-center gap-2"
              >
                {#if isMinting}
                  <Loader2 class="w-5 h-5 animate-spin" />
                  Minting...
                {:else}
                  Mint Warranty NFT
                {/if}
              </Button>
            {/if}
            <p class="text-center text-xs text-slate-500 mt-4">
              Requires MetaMask or a Web3 compatible wallet. Gas fees apply.
            </p>
          </div>
        </form>
      </div>
    </div>

  </main>
</div>

