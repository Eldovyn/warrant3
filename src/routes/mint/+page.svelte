<script lang="ts">
  import { ShieldCheck, ChevronLeft, ImagePlus, Loader2, Wallet } from '@lucide/svelte';
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
  let productValue = $state<number | null>(null);
  let customerWallet = $state("");

  let isMinting = $state(false);
  let statusText = $state("");
  let errorMsg = $state("");
  let mintHash = $state<string | null>(null);
  let mintedTokenId = $state<string | null>(null);

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
    if (!file) { errorMsg = "Please upload a warranty card thumbnail."; return; }
    if (!productName || !serialNumber || !duration || !productValue || !customerWallet) {
      errorMsg = "Please fill in all fields."; return;
    }

    errorMsg = "";
    isMinting = true;
    mintHash = null;
    mintedTokenId = null;

    try {
      statusText = "Uploading image to IPFS…";
      const imageIpfsHash = await pinFileToIPFS(file, {
        name: `Warranty_${serialNumber}_image`,
        keyvalues: { productName, serialNumber }
      });
      const imageUrl = `ipfs://${imageIpfsHash}`;

      statusText = "Uploading metadata to IPFS…";
      const metadata = {
        name: `Warranty NFT - ${productName}`,
        description: `Official blockchain-backed digital warranty for ${productName}.`,
        image: imageUrl,
        attributes: [
          { trait_type: "Product Name",       value: productName },
          { trait_type: "Serial Number",      value: serialNumber },
          { trait_type: "Duration (Months)",  value: duration.toString() },
          { trait_type: "Issuer",             value: web3State.address }
        ]
      };
      const metadataIpfsHash = await pinJSONToIPFS(metadata, {
        name: `Warranty_${serialNumber}_meta`,
        keyvalues: { productName, serialNumber }
      });
      const metadataUrl = `ipfs://${metadataIpfsHash}`;

      statusText = "Please confirm the transaction in your wallet…";
      const hash = await writeContract(config, {
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: 'mintWarranty',
        args: [
          customerWallet as `0x${string}`,
          metadataUrl,
          productName,
          serialNumber,
          BigInt(duration) * 2592000n,
          BigInt(productValue)
        ]
      });

      mintHash = hash;
      statusText = "Waiting for transaction confirmation…";
      const receipt = await waitForTransactionReceipt(config, { hash });

      const logs = parseEventLogs({ abi: WarrantyNFTAbi, eventName: 'WarrantyMinted', logs: receipt.logs });
      if (logs && logs[0]) {
        const tokenIdVal = (logs[0] as any).args?.tokenId;
        mintedTokenId = tokenIdVal !== undefined ? tokenIdVal.toString() : null;
      }
      statusText = mintedTokenId
        ? `🎉 Successfully minted! Token ID: #${mintedTokenId}`
        : "🎉 Warranty NFT successfully minted!";

      file = null; previewUrl = null; fileName = "";
      productName = ""; serialNumber = ""; duration = null; productValue = null;
    } catch (err: any) {
      console.error(err);
      errorMsg = err.message || "An error occurred during minting.";
      statusText = "";
    } finally {
      isMinting = false;
    }
  }
</script>

<svelte:head>
  <title>Mint Warranty — Warrant3</title>
  <meta name="description" content="Mint a new Warranty NFT by uploading product details and image to IPFS." />
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
    <!-- Left info panel -->
    <div class="info-panel animate-fade-in-up">
      <div class="panel-badge">Step-by-step</div>
      <h1 class="panel-title">Mint a New<br /><span class="gradient-text">Warranty NFT</span></h1>
      <p class="panel-sub">
        Digitize your physical product warranties. Create an immutable,
        globally verifiable proof of ownership that lasts forever.
      </p>

      <ol class="steps">
        <li class="step">
          <div class="step-num">1</div>
          <div>
            <div class="step-title">Upload Thumbnail</div>
            <div class="step-desc">Upload the product image to IPFS for decentralized storage.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num">2</div>
          <div>
            <div class="step-title">Fill Product Details</div>
            <div class="step-desc">Enter the product name, serial number, and warranty duration.</div>
          </div>
        </li>
        <li class="step">
          <div class="step-num">3</div>
          <div>
            <div class="step-title">Confirm & Mint</div>
            <div class="step-desc">Approve the transaction in your wallet to mint the NFT on-chain.</div>
          </div>
        </li>
      </ol>
    </div>

    <!-- Form panel -->
    <div class="form-panel animate-fade-in-up" style="animation-delay: 100ms">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Warranty Details</h2>
          <p class="card-sub">Fill in the product details to generate the metadata.</p>
        </div>

        <form class="form" onsubmit={handleMint}>
          <!-- Image Upload -->
          <div class="field">
            <label for="file-upload" class="label">Warranty Card Thumbnail</label>
            <div class="upload-zone" class:has-preview={!!previewUrl}>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                class="sr-only"
                onchange={handleFileChange}
              />
              {#if previewUrl}
                <img src={previewUrl} alt="Preview" class="upload-preview" />
                <div class="upload-caption">
                  <span class="filename">{fileName}</span>
                  <label for="file-upload" class="change-link">Click to change</label>
                </div>
              {:else}
                <label for="file-upload" class="upload-placeholder">
                  <div class="upload-icon">
                    <ImagePlus size={28} />
                  </div>
                  <div class="upload-text">
                    <span class="upload-cta">Click to upload</span>
                    <span class="upload-hint">PNG, JPG, GIF — up to 10 MB</span>
                  </div>
                </label>
              {/if}
            </div>
          </div>

          <!-- Product Name -->
          <div class="field">
            <label for="product_name" class="label">Product Name</label>
            <input
              id="product_name"
              type="text"
              bind:value={productName}
              class="input"
              placeholder="e.g. Asus ROG Strix G15"
              required
            />
          </div>

          <!-- Serial Number -->
          <div class="field">
            <label for="serial_number" class="label">Serial Number</label>
            <input
              id="serial_number"
              type="text"
              bind:value={serialNumber}
              class="input"
              placeholder="e.g. SN-98234-XYZ"
              required
            />
          </div>

          <!-- Duration, Value + Customer Wallet -->
          <div class="field-row">
            <div class="field">
              <label for="duration" class="label">Duration (Months)</label>
              <input
                id="duration"
                type="number"
                bind:value={duration}
                class="input"
                placeholder="24"
                min="1"
                required
              />
            </div>
            <div class="field">
              <label for="product_value" class="label">Product Value ($)</label>
              <input
                id="product_value"
                type="number"
                bind:value={productValue}
                class="input"
                placeholder="200"
                min="1"
                required
              />
            </div>
            <div class="field" style="grid-column: span 2;">
              <label for="customer_wallet" class="label">Customer Wallet</label>
              <input
                id="customer_wallet"
                type="text"
                bind:value={customerWallet}
                class="input"
                placeholder="0x…"
                required
              />
            </div>
          </div>

          <!-- Error -->
          {#if errorMsg}
            <div class="alert alert-error">{errorMsg}</div>
          {/if}

          <!-- Status -->
          {#if statusText}
            <div class="alert alert-info">
              {#if isMinting && !mintHash}
                <Loader2 size={14} class="spin" />
              {/if}
              {statusText}
            </div>
          {/if}

          <!-- Tx Hash -->
          {#if mintHash}
            <div class="tx-box">
              <div class="tx-label">Transaction Hash</div>
              <a
                href="https://sepolia.etherscan.io/tx/{mintHash}"
                target="_blank"
                rel="noreferrer"
                class="tx-hash"
              >{mintHash}</a>
            </div>
          {/if}

          <!-- Submit -->
          {#if !web3State.isConnected}
            <button
              type="button"
              onclick={() => web3State.connect()}
              disabled={web3State.isConnecting}
              class="btn-submit btn-connect"
            >
              {#if web3State.isConnecting}
                <Loader2 size={18} class="spin" />
                Connecting Wallet…
              {:else}
                <Wallet size={18} />
                Connect Wallet to Mint
              {/if}
            </button>
          {:else}
            <button type="submit" disabled={isMinting} class="btn-submit">
              {#if isMinting}
                <Loader2 size={18} class="spin" />
                Minting…
              {:else}
                Mint Warranty NFT
              {/if}
            </button>
          {/if}

          <p class="form-note">
            Requires MetaMask or a Web3 compatible wallet. Gas fees apply.
          </p>
        </form>
      </div>
    </div>
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
  .glow-tl { top: -150px; left: -150px; width: 500px; height: 500px; background: rgba(20, 71, 230, 0.07); }
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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: start;
    padding-top: 64px;
    padding-bottom: 80px;
    position: relative;
    z-index: 1;
  }

  /* ── Info panel ── */
  .info-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 80px;
  }
  .panel-badge {
    display: inline-flex;
    font-size: 11px;
    font-weight: 500;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 999px;
    padding: 4px 12px;
    width: fit-content;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .panel-title {
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 700;
    line-height: 1.15;
    color: #FFFFFF;
    letter-spacing: -0.5px;
  }
  .gradient-text {
    background: linear-gradient(135deg, #60A5FA, #1447E6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .panel-sub {
    font-size: 15px;
    color: #64748B;
    line-height: 1.65;
  }

  /* ── Steps ── */
  .steps {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 8px;
    list-style: none;
  }
  .step {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .step-num {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(20, 71, 230, 0.15);
    border: 1px solid rgba(20, 71, 230, 0.3);
    color: #60A5FA;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-title {
    font-size: 14px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 4px;
  }
  .step-desc {
    font-size: 13px;
    color: #64748B;
    line-height: 1.5;
  }

  /* ── Form card ── */
  .card {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .card-header { margin-bottom: 24px; }
  .card-title {
    font-size: 20px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 6px;
  }
  .card-sub { font-size: 13px; color: #64748B; }

  /* ── Form ── */
  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .label {
    font-size: 13px;
    font-weight: 500;
    color: #D1D5DB;
  }

  .input {
    background: #0A0A0A;
    border: 1px solid #64748B;
    border-radius: 8px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    color: #FFFFFF;
    width: 100%;
    transition: border-color 200ms ease, box-shadow 200ms ease;
    outline: none;
    line-height: 24px;
  }
  .input::placeholder { color: #737373; }
  .input:focus {
    border-color: #60A5FA;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
  }
  .input:disabled {
    background: #171717;
    color: #737373;
    cursor: not-allowed;
    border-color: #262626;
  }

  /* ── Upload zone ── */
  .upload-zone {
    border: 1px dashed #64748B;
    border-radius: 8px;
    background: #0A0A0A;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 200ms ease, background 200ms ease;
    overflow: hidden;
    position: relative;
  }
  .upload-zone:hover {
    border-color: #60A5FA;
    background: rgba(96, 165, 250, 0.04);
  }
  .upload-zone.has-preview {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-style: solid;
    border-color: rgba(96, 165, 250, 0.3);
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 24px;
    width: 100%;
    text-align: center;
  }
  .upload-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #60A5FA;
  }
  .upload-text { display: flex; flex-direction: column; gap: 4px; }
  .upload-cta {
    font-size: 14px;
    font-weight: 500;
    color: #60A5FA;
  }
  .upload-hint { font-size: 12px; color: #64748B; }

  .upload-preview {
    max-height: 140px;
    object-fit: contain;
    border-radius: 6px;
  }
  .upload-caption {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .filename { font-size: 13px; color: #D1D5DB; font-weight: 500; }
  .change-link { font-size: 12px; color: #60A5FA; cursor: pointer; }

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ── Alerts ── */
  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    padding: 12px 16px;
    border-radius: 8px;
  }
  .alert-error {
    color: #E40014;
    background: rgba(228, 0, 20, 0.06);
    border: 1px solid rgba(228, 0, 20, 0.2);
  }
  .alert-info {
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.06);
    border: 1px solid rgba(96, 165, 250, 0.2);
  }

  /* ── Tx box ── */
  .tx-box {
    background: #0A0A0A;
    border: 1px solid #262626;
    border-radius: 8px;
    padding: 14px 16px;
  }
  .tx-label {
    font-size: 11px;
    font-weight: 500;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .tx-hash {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px;
    color: #60A5FA;
    word-break: break-all;
    display: block;
    text-decoration: none;
    transition: color 200ms ease;
  }
  .tx-hash:hover { color: #FFFFFF; text-decoration: underline; }

  /* ── Submit button ── */
  .btn-submit {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 24px;
    border-radius: 8px;
    border: none;
    background: #1447E6;
    color: #FFFFFF;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(20, 71, 230, 0.3);
    transition: background 200ms ease, box-shadow 200ms ease, transform 200ms ease;
    margin-top: 4px;
  }
  .btn-submit:hover:not(:disabled) {
    background: #1035C1;
    box-shadow: 0 4px 16px rgba(20, 71, 230, 0.4);
    transform: translateY(-1px);
  }
  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .btn-connect {
    background: transparent;
    border: 1px solid #262626;
    color: #D1D5DB;
    box-shadow: none;
  }
  .btn-connect:hover:not(:disabled) {
    border-color: #60A5FA;
    color: #FFFFFF;
    background: rgba(96, 165, 250, 0.06);
    box-shadow: none;
  }

  .form-note {
    font-size: 12px;
    color: #64748B;
    text-align: center;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .page-main { grid-template-columns: 1fr; gap: 40px; }
    .info-panel { position: static; }
  }
  @media (max-width: 600px) {
    .field-row { grid-template-columns: 1fr; }
    .card { padding: 24px 20px; }
  }
</style>
