<script lang="ts">
  import { ShieldCheck, ChevronLeft, Search, CheckCircle2, Loader2, ShieldAlert } from "@lucide/svelte";
  import { readContract } from "@wagmi/core";
  import { config } from "$lib/wagmi";
  import { sepolia } from "@wagmi/core/chains";
  import WarrantyNFTAbi from "../../abi/WarrantyNFT.json";
  import axios from "axios";

  let searchTokenId = $state("");
  let isVerifying = $state(false);
  let errorMsg = $state("");
  let result = $state<any>(null);

  async function handleVerify(e: SubmitEvent) {
    e.preventDefault();
    if (!searchTokenId) return;

    isVerifying = true;
    errorMsg = "";
    result = null;

    try {
      const tokenId = BigInt(searchTokenId.replace(/#/g, "").trim());

      const details = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "getWarrantyDetails",
        args: [tokenId],
      })) as any;

      const details_productId      = details.productId      !== undefined ? details.productId      : details[0];
      const details_serialNumber   = details.serialNumber   !== undefined ? details.serialNumber   : details[1];
      const details_activationTime = details.activationTime !== undefined ? details.activationTime : details[2];
      const details_duration       = details.duration       !== undefined ? details.duration       : details[3];

      const owner = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "ownerOf",
        args: [tokenId],
      })) as `0x${string}`;

      const isActive = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "isWarrantyActive",
        args: [tokenId],
      })) as boolean;

      const uri = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "tokenURI",
        args: [tokenId],
      })) as string;

      let metadata: any = null;
      if (uri) {
        const gatewayUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
        try {
          const response = await axios.get(gatewayUrl, { timeout: 10000 });
          metadata = response.data;
        } catch (ipfsErr) {
          console.error("Failed to fetch IPFS metadata:", ipfsErr);
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

      result = {
        tokenId: tokenId.toString(),
        productId: details_productId,
        serialNumber: details_serialNumber,
        activationDate: activationDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        expiryDate: expiryDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        owner,
        isActive,
        metadata,
      };
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("ERC721NonexistentToken")) {
        errorMsg = "This token ID does not exist or has not been minted yet.";
      } else {
        errorMsg = "Token ID not found or contract read failed. Please check the ID and try again.";
      }
    } finally {
      isVerifying = false;
    }
  }
</script>

<svelte:head>
  <title>Verify Warranty — Warrant3</title>
  <meta name="description" content="Verify the authenticity and status of a warranty NFT on the Ethereum blockchain." />
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
    <!-- Hero header -->
    <div class="page-header animate-fade-in-up">
      <div class="icon-badge">
        <Search size={24} />
      </div>
      <h1 class="page-title">Verify Warranty</h1>
      <p class="page-sub">
        Enter the NFT Token ID to verify the authenticity and status of a
        warranty on the Ethereum blockchain.
      </p>
    </div>

    <!-- Search form -->
    <form
      onsubmit={handleVerify}
      class="search-form animate-fade-in-up"
      style="animation-delay: 80ms"
    >
      <div class="search-box">
        <Search size={18} class="search-icon" />
        <input
          type="text"
          id="token-search"
          bind:value={searchTokenId}
          placeholder="Enter Token ID (e.g. 1)"
          class="search-input"
          required
        />
        <button
          type="submit"
          disabled={isVerifying}
          class="search-btn"
        >
          {#if isVerifying}
            <Loader2 size={15} class="spin" />
            Verifying…
          {:else}
            Verify
          {/if}
        </button>
      </div>
    </form>

    <!-- Error state -->
    {#if errorMsg}
      <div class="error-card animate-fade-in">
        <ShieldAlert size={20} />
        <span>{errorMsg}</span>
      </div>
    {/if}

    <!-- Result card -->
    {#if result}
      <div class="result-section animate-fade-in-up">
        <!-- Status banner -->
        <div class="status-banner" class:status-active={result.isActive} class:status-expired={!result.isActive}>
          {#if result.isActive}
            <CheckCircle2 size={18} />
            <span>Authentic & Active Warranty</span>
          {:else}
            <ShieldAlert size={18} />
            <span>Expired / Inactive Warranty</span>
          {/if}
        </div>

        <div class="result-card">
          <!-- Product image -->
          {#if result.metadata?.image}
            <div class="result-image-wrap">
              <img
                src={result.metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")}
                alt={result.productId}
                class="result-image"
              />
            </div>
          {/if}

          <!-- Header row -->
          <div class="result-header">
            <div>
              <h2 class="result-product">{result.productId}</h2>
              {#if result.metadata?.description}
                <p class="result-desc">{result.metadata.description}</p>
              {/if}
            </div>
            <div class="token-badge">
              <span class="token-label">Token ID</span>
              <span class="token-value">#{result.tokenId}</span>
            </div>
          </div>

          <!-- Details table -->
          <div class="detail-table">
            <div class="detail-row">
              <span class="detail-key">Owner</span>
              <span class="detail-val mono">
                {result.owner.slice(0, 10)}…{result.owner.slice(-8)}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Serial Number</span>
              <span class="detail-val">{result.serialNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Activation Date</span>
              <span class="detail-val">{result.activationDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Expiry Date</span>
              <span class="detail-val" class:val-expired={!result.isActive}>
                {result.expiryDate}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-key">Status</span>
              {#if result.isActive}
                <span class="status-chip status-chip--active">Active</span>
              {:else}
                <span class="status-chip status-chip--expired">Expired</span>
              {/if}
            </div>
          </div>
        </div>
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
    max-width: 860px;
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
    max-width: 1180px;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    padding-top: 64px;
    padding-bottom: 80px;
    position: relative;
    z-index: 1;
  }

  /* ── Page header ── */
  .page-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 560px;
  }
  .icon-badge {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #60A5FA;
  }
  .page-title {
    font-size: 36px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
  }
  .page-sub {
    font-size: 15px;
    color: #64748B;
    line-height: 1.6;
    margin: 0;
  }

  /* ── Search form ── */
  .search-form { width: 100%; max-width: 640px; }
  .search-box {
    display: flex;
    align-items: center;
    background: #171717;
    border: 1px solid #64748B;
    border-radius: 10px;
    padding: 6px 6px 6px 16px;
    gap: 8px;
    transition: border-color 200ms ease, box-shadow 200ms ease;
  }
  .search-box:focus-within {
    border-color: #60A5FA;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
  }
  :global(.search-icon) { color: #64748B; flex-shrink: 0; }

  .search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    color: #FFFFFF;
    line-height: 1.5;
    min-width: 0;
  }
  .search-input::placeholder { color: #737373; }

  .search-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 22px;
    border-radius: 7px;
    border: none;
    background: #1447E6;
    color: #FFFFFF;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(20, 71, 230, 0.3);
    transition: background 200ms ease, box-shadow 200ms ease;
  }
  .search-btn:hover:not(:disabled) {
    background: #1035C1;
    box-shadow: 0 4px 12px rgba(20, 71, 230, 0.4);
  }
  .search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Error card ── */
  .error-card {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(228, 0, 20, 0.06);
    border: 1px solid rgba(228, 0, 20, 0.2);
    border-radius: 8px;
    padding: 14px 18px;
    color: #E40014;
    font-size: 14px;
    width: 100%;
    max-width: 640px;
  }

  /* ── Result section ── */
  .result-section {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Status banner ── */
  .status-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 18px;
    border-radius: 8px;
  }
  .status-active {
    color: #10B981;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }
  .status-expired {
    color: #E40014;
    background: rgba(228, 0, 20, 0.06);
    border: 1px solid rgba(228, 0, 20, 0.2);
  }

  /* ── Result card ── */
  .result-card {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .result-image-wrap {
    width: 100%;
    aspect-ratio: 16/9;
    background: #0A0A0A;
    border-bottom: 1px solid #262626;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .result-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .result-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px 24px 0;
  }
  .result-product {
    font-size: 20px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 6px;
  }
  .result-desc {
    font-size: 13px;
    color: #64748B;
    line-height: 1.5;
  }

  .token-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  }
  .token-label {
    font-size: 10px;
    color: #64748B;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .token-value {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 13px;
    font-weight: 600;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 6px;
    padding: 4px 10px;
  }

  /* ── Detail table ── */
  .detail-table {
    display: flex;
    flex-direction: column;
    padding: 20px 24px 24px;
    gap: 0;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #262626;
    gap: 16px;
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-key {
    font-size: 13px;
    color: #64748B;
    font-weight: 500;
    flex-shrink: 0;
  }
  .detail-val {
    font-size: 13px;
    color: #D1D5DB;
    font-weight: 500;
    text-align: right;
  }
  .detail-val.mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px;
  }
  .val-expired { color: #E40014; }

  /* ── Status chips ── */
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .status-chip--active {
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
  }
  .status-chip--expired {
    color: #E40014;
    background: rgba(228, 0, 20, 0.08);
    border: 1px solid rgba(228, 0, 20, 0.2);
  }

  /* ── Utilities ── */
  .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .page-title { font-size: 28px; }
    .search-box { padding: 4px 4px 4px 12px; }
    .search-btn { padding: 10px 16px; }
    .result-header { flex-direction: column; }
    .token-badge { align-items: flex-start; }
  }
</style>
