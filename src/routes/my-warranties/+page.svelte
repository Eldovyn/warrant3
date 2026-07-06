<script lang="ts">
  import { ShieldCheck, ChevronLeft, Loader2, Wallet, Send, Calendar, Hash, Package, ShieldAlert, CheckCircle2, ExternalLink } from '@lucide/svelte';
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
    showTransferInput: boolean;
    recipientAddress: string;
    isTransferring: boolean;
    transferError: string;
  }

  let warranties = $state<WarrantyItem[]>([]);
  let isLoading = $state(false);
  let errorMsg = $state("");

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
      const balance = await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`]
      }) as bigint;

      if (balance === 0n) { isLoading = false; return; }

      const publicClient = getPublicClient(config, { chainId: sepolia.id });
      const logs = await publicClient.getLogs({
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
        args: { to: userAddress as `0x${string}` },
        fromBlock: 11215900n
      });

      const uniqueTokenIds = [...new Set(logs.map(log => log.args.tokenId))];
      const items: WarrantyItem[] = [];

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

          if (currentOwner.toLowerCase() !== userAddress.toLowerCase()) continue;

          const details = await readContract(config, {
            chainId: sepolia.id,
            address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
            abi: WarrantyNFTAbi,
            functionName: 'getWarrantyDetails',
            args: [tokenId]
          }) as any;

          const productId      = details.productId      !== undefined ? details.productId      : details[0];
          const serialNumber   = details.serialNumber   !== undefined ? details.serialNumber   : details[1];
          const activationTime = details.activationTime !== undefined ? details.activationTime : details[2];
          const duration       = details.duration       !== undefined ? details.duration       : details[3];

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
            try {
              const res = await axios.get(uri.replace('ipfs://', 'https://ipfs.io/ipfs/'), { timeout: 8000 });
              metadata = res.data;
            } catch {}
          }

          const activationDate = new Date(Number(activationTime) * 1000);
          let expiryDate: Date;
          if (Number(duration) > 1000) {
            expiryDate = new Date((Number(activationTime) + Number(duration)) * 1000);
          } else {
            expiryDate = new Date(activationDate.getTime());
            expiryDate.setMonth(expiryDate.getMonth() + Number(duration));
          }

          items.push({
            tokenId: tokenId.toString(),
            productId,
            serialNumber,
            activationDate: activationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            expiryDate: expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            isActive,
            metadata,
            showTransferInput: false,
            recipientAddress: "",
            isTransferring: false,
            transferError: ""
          });
        } catch (tokenErr) {
          console.error(`Failed to read details for token #${tokenId}:`, tokenErr);
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
      item.transferError = "Invalid recipient wallet address.";
      return;
    }
    item.isTransferring = true;
    item.transferError = "";
    try {
      const hash = await writeContract(config, {
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'safeTransferFrom',
        args: [web3State.address as `0x${string}`, item.recipientAddress as `0x${string}`, BigInt(item.tokenId)]
      });
      await waitForTransactionReceipt(config, { hash });
      warranties = warranties.filter(w => w.tokenId !== item.tokenId);
    } catch (err: any) {
      console.error(err);
      item.transferError = err.message || "Transfer failed. Check network or address.";
    } finally {
      item.isTransferring = false;
    }
  }
</script>

<svelte:head>
  <title>My Warranties — Warrant3</title>
  <meta name="description" content="View and manage all warranty NFTs in your Web3 wallet." />
</svelte:head>

<div class="root">
  <!-- Ambient glows -->
  <div class="glow glow-tl" aria-hidden="true"></div>
  <div class="glow glow-br" aria-hidden="true"></div>

  <!-- Navbar -->
  <header class="navbar">
    <div class="container navbar-inner">
      <a href="/" class="back-link">
        <ChevronLeft size={16} />
        Back to Home
      </a>
      <a href="/" class="brand">
        <ShieldCheck size={18} />
        <span>Warrant3</span>
      </a>
    </div>
  </header>

  <main class="container page-main">
    <!-- Page heading -->
    <div class="page-heading animate-fade-in-up">
      <div>
        <h1 class="page-title">My Warranties</h1>
        <p class="page-sub">View and manage the warranty NFTs in your Web3 wallet.</p>
      </div>
      <div class="heading-actions">
        {#if web3State.isConnected}
          <div class="wallet-chip">
            <span class="wallet-dot" aria-hidden="true"></span>
            <span class="wallet-addr">{web3State.address?.slice(0, 6)}…{web3State.address?.slice(-4)}</span>
          </div>
          <button onclick={() => web3State.disconnect()} class="btn-disconnect">
            Disconnect
          </button>
        {:else}
          <button onclick={() => web3State.connect()} disabled={web3State.isConnecting} class="btn-connect">
            {#if web3State.isConnecting}
              <Loader2 size={16} class="spin" />
              Connecting…
            {:else}
              <Wallet size={16} />
              Connect Wallet
            {/if}
          </button>
        {/if}
      </div>
    </div>

    <!-- States -->
    {#if !web3State.isConnected}
      <!-- Disconnected -->
      <div class="state-card animate-fade-in">
        <div class="state-icon state-icon--blue">
          <Wallet size={28} />
        </div>
        <h2 class="state-title">Connect Your Wallet</h2>
        <p class="state-desc">
          Connect your Web3 compatible wallet (e.g. MetaMask) to query the blockchain
          and display all warranty NFTs you own.
        </p>
        <button
          onclick={() => web3State.connect()}
          disabled={web3State.isConnecting}
          class="btn-primary"
        >
          {#if web3State.isConnecting}
            <Loader2 size={16} class="spin" />
            Connecting Wallet…
          {:else}
            <Wallet size={16} />
            Connect Wallet
          {/if}
        </button>
      </div>

    {:else if isLoading}
      <!-- Loading -->
      <div class="loading-state animate-fade-in">
        <Loader2 size={32} class="spin loading-icon" />
        <p class="loading-text">Scanning blockchain for your warranties…</p>
        <p class="loading-hint">This may take a few seconds.</p>
      </div>

    {:else if errorMsg}
      <!-- Error -->
      <div class="state-card state-card--error animate-fade-in">
        <div class="state-icon state-icon--error">
          <ShieldAlert size={28} />
        </div>
        <h2 class="state-title">Blockchain Query Error</h2>
        <p class="state-desc">{errorMsg}</p>
        <button onclick={() => loadWarranties(web3State.address!)} class="btn-secondary">
          Retry Search
        </button>
      </div>

    {:else if warranties.length === 0}
      <!-- Empty -->
      <div class="state-card animate-fade-in">
        <div class="state-icon state-icon--gray">
          <Package size={28} />
        </div>
        <h2 class="state-title">No Warranties Found</h2>
        <p class="state-desc">
          We couldn't find any Warranty NFTs associated with your wallet.
          If you recently received a product, you can mint its warranty on-chain.
        </p>
        <a href="/mint" class="btn-primary">
          Mint a Warranty
        </a>
      </div>

    {:else}
      <!-- Warranty grid -->
      <div class="grid animate-fade-in">
        {#each warranties as item (item.tokenId)}
          <div class="warranty-card">
            <!-- Thumbnail -->
            <div class="card-thumb">
              {#if item.metadata?.image}
                <img
                  src={item.metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                  alt={item.productId}
                  class="card-img"
                />
              {:else}
                <div class="card-img-placeholder">
                  <Package size={32} />
                </div>
              {/if}
              <!-- Status badge on top right of image -->
              {#if item.isActive}
                <span class="card-status card-status--active">Active</span>
              {:else}
                <span class="card-status card-status--expired">Expired</span>
              {/if}
            </div>

            <!-- Card body -->
            <div class="card-body">
              <div class="card-top">
                <h3 class="card-title">{item.productId}</h3>
                <span class="token-id">#{item.tokenId}</span>
              </div>

              {#if item.metadata?.description}
                <p class="card-desc">{item.metadata.description}</p>
              {/if}

              <div class="card-meta">
                <div class="meta-row">
                  <Hash size={13} />
                  <span class="meta-key">Serial</span>
                  <span class="meta-val mono">{item.serialNumber}</span>
                </div>
                <div class="meta-row">
                  <Calendar size={13} />
                  <span class="meta-key">Expiry</span>
                  <span class="meta-val" class:expired={!item.isActive}>{item.expiryDate}</span>
                </div>
              </div>

              <!-- Transfer section -->
              <div class="card-footer">
                {#if !item.showTransferInput}
                  <button
                    onclick={() => item.showTransferInput = true}
                    class="btn-transfer"
                  >
                    <Send size={14} />
                    Transfer Warranty
                  </button>
                {:else}
                  <div class="transfer-form animate-fade-in">
                    <label class="transfer-label">Recipient Wallet Address</label>
                    <div class="transfer-row">
                      <input
                        type="text"
                        bind:value={item.recipientAddress}
                        placeholder="0x…"
                        class="transfer-input"
                        disabled={item.isTransferring}
                        required
                      />
                      <button
                        onclick={() => handleTransfer(item)}
                        disabled={item.isTransferring}
                        class="transfer-send"
                      >
                        {#if item.isTransferring}
                          <Loader2 size={14} class="spin" />
                        {:else}
                          Send
                        {/if}
                      </button>
                    </div>

                    {#if item.transferError}
                      <p class="transfer-error">{item.transferError}</p>
                    {/if}

                    <button
                      onclick={() => {
                        item.showTransferInput = false;
                        item.recipientAddress = "";
                        item.transferError = "";
                      }}
                      disabled={item.isTransferring}
                      class="transfer-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  /* ── Root ── */
  .root {
    min-height: 100vh;
    background: #0A0A0A;
    color: #FFFFFF;
    font-family: 'Poppins', sans-serif;
    position: relative;
    overflow-x: hidden;
  }
  .container {
    max-width: 1180px;
    margin-inline: auto;
    padding-inline: 24px;
  }

  /* ── Glows ── */
  .glow {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(120px);
  }
  .glow-tl { top: -150px; left: -150px; width: 500px; height: 500px; background: rgba(20, 71, 230, 0.06); }
  .glow-br { bottom: -150px; right: -150px; width: 400px; height: 400px; background: rgba(96, 165, 250, 0.05); }

  /* ── Navbar ── */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10, 10, 10, 0.9);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #262626;
    height: 60px;
    display: flex;
    align-items: center;
  }
  .navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .back-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #64748B;
    text-decoration: none;
    transition: color 200ms ease;
  }
  .back-link:hover { color: #FFFFFF; }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    text-decoration: none;
  }
  .brand :global(svg) { color: #60A5FA; }

  /* ── Page layout ── */
  .page-main {
    padding-top: 48px;
    padding-bottom: 80px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  /* ── Page heading ── */
  .page-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 32px;
    border-bottom: 1px solid #262626;
    flex-wrap: wrap;
  }
  .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }
  .page-sub {
    font-size: 15px;
    color: #64748B;
  }
  .heading-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  .wallet-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 8px;
    padding: 8px 14px;
  }
  .wallet-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #10B981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    animation: pulse-dot 2s infinite;
    flex-shrink: 0;
  }
  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); }
    50%       { box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); }
  }
  .wallet-addr { color: inherit; }

  .btn-disconnect {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid rgba(228, 0, 20, 0.3);
    background: transparent;
    color: #E40014;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-disconnect:hover {
    background: rgba(228, 0, 20, 0.08);
    border-color: #E40014;
  }

  /* ── State cards ── */
  .state-card {
    max-width: 540px;
    margin-inline: auto;
    background: #171717;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .state-card--error { border-color: rgba(228, 0, 20, 0.2); }

  .state-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .state-icon--blue  { background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.2); color: #60A5FA; }
  .state-icon--error { background: rgba(228, 0, 20, 0.06); border: 1px solid rgba(228, 0, 20, 0.2); color: #E40014; }
  .state-icon--gray  { background: #262626; border: 1px solid #262626; color: #64748B; }

  .state-title {
    font-size: 22px;
    font-weight: 700;
    color: #FFFFFF;
  }
  .state-desc {
    font-size: 14px;
    color: #64748B;
    line-height: 1.65;
    max-width: 380px;
    margin: 0;
  }

  /* ── Loading ── */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 24px;
    text-align: center;
  }
  :global(.loading-icon) { color: #60A5FA; }
  .loading-text {
    font-size: 15px;
    font-weight: 500;
    color: #D1D5DB;
  }
  .loading-hint { font-size: 13px; color: #64748B; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    background: #1447E6;
    color: #FFFFFF;
    text-decoration: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(20, 71, 230, 0.3);
    transition: background 200ms ease, box-shadow 200ms ease;
  }
  .btn-primary:hover:not(:disabled) {
    background: #1035C1;
    box-shadow: 0 4px 16px rgba(20, 71, 230, 0.4);
    color: #FFFFFF;
  }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 22px;
    border-radius: 8px;
    border: 1px solid #262626;
    background: transparent;
    color: #D1D5DB;
    cursor: pointer;
    transition: all 200ms ease;
    text-decoration: none;
  }
  .btn-secondary:hover { border-color: #64748B; color: #FFFFFF; }

  .btn-connect {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 22px;
    border-radius: 8px;
    border: 1px solid #262626;
    background: transparent;
    color: #D1D5DB;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-connect:hover:not(:disabled) { border-color: #60A5FA; color: #FFFFFF; }
  .btn-connect:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Grid ── */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  /* ── Warranty card ── */
  .warranty-card {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .warranty-card:hover {
    border-color: #64748B;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    transform: translateY(-3px);
  }

  /* ── Card thumbnail ── */
  .card-thumb {
    position: relative;
    aspect-ratio: 16/9;
    background: #0A0A0A;
    overflow: hidden;
    border-bottom: 1px solid #262626;
  }
  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 400ms ease;
  }
  .warranty-card:hover .card-img { transform: scale(1.04); }
  .card-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748B;
  }

  .card-status {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .card-status--active {
    color: #10B981;
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid rgba(16, 185, 129, 0.4);
    backdrop-filter: blur(4px);
  }
  .card-status--expired {
    color: #E40014;
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid rgba(228, 0, 20, 0.4);
    backdrop-filter: blur(4px);
  }

  /* ── Card body ── */
  .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: 1;
  }

  .card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1.3;
  }
  .token-id {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11px;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 6px;
    padding: 3px 8px;
    flex-shrink: 0;
  }
  .card-desc {
    font-size: 12px;
    color: #64748B;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
    border-top: 1px solid #262626;
    border-bottom: 1px solid #262626;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748B;
  }
  .meta-row :global(svg) { flex-shrink: 0; color: #64748B; }
  .meta-key {
    color: #64748B;
    font-weight: 500;
    flex-shrink: 0;
  }
  .meta-val {
    color: #D1D5DB;
    margin-left: auto;
    text-align: right;
  }
  .meta-val.mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11px;
  }
  .expired { color: #E40014 !important; }

  /* ── Card footer / transfer ── */
  .card-footer { margin-top: auto; }

  .btn-transfer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #262626;
    background: transparent;
    color: #64748B;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-transfer:hover {
    border-color: #60A5FA;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.06);
  }

  .transfer-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .transfer-label {
    font-size: 11px;
    font-weight: 500;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .transfer-row {
    display: flex;
    gap: 8px;
  }
  .transfer-input {
    flex: 1;
    background: #0A0A0A;
    border: 1px solid #64748B;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px;
    color: #FFFFFF;
    outline: none;
    transition: border-color 200ms ease, box-shadow 200ms ease;
    min-width: 0;
  }
  .transfer-input::placeholder { color: #737373; }
  .transfer-input:focus {
    border-color: #60A5FA;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.12);
  }
  .transfer-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .transfer-send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    background: #1447E6;
    color: #FFFFFF;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 200ms ease;
  }
  .transfer-send:hover:not(:disabled) { background: #1035C1; }
  .transfer-send:disabled { opacity: 0.6; cursor: not-allowed; }

  .transfer-error {
    font-size: 12px;
    color: #E40014;
    margin: 0;
  }
  .transfer-cancel {
    align-self: flex-end;
    background: none;
    border: none;
    font-family: 'Poppins', sans-serif;
    font-size: 12px;
    color: #64748B;
    cursor: pointer;
    transition: color 200ms ease;
    padding: 4px;
  }
  .transfer-cancel:hover { color: #FFFFFF; }
  .transfer-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Utilities ── */
  :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .page-heading { flex-direction: column; align-items: flex-start; }
    .grid { grid-template-columns: 1fr; }
    .state-card { padding: 32px 24px; }
    .page-title { font-size: 26px; }
  }
</style>
