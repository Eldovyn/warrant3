<script lang="ts">
  import { ShieldCheck, Link, Zap, ChevronRight, Wallet, ArrowRight, CheckCircle } from '@lucide/svelte';
  import { web3State } from "$lib/web3.svelte";
</script>

<svelte:head>
  <title>Warrant3 — Blockchain-Powered Warranty NFTs</title>
  <meta name="description" content="Tokenize product warranties as Real World Assets on the Ethereum blockchain. Immutable, verifiable, and freely tradable." />
</svelte:head>

<div class="root">
  <!-- Ambient glow -->
  <div class="glow glow-top" aria-hidden="true"></div>
  <div class="glow glow-bottom" aria-hidden="true"></div>

  <!-- ── Navbar ── -->
  <header class="navbar">
    <div class="container navbar-inner">
      <a href="/" class="brand">
        <ShieldCheck size={22} />
        <span>Warrant3</span>
      </a>

      <nav class="nav-links" aria-label="Main navigation">
        <a href="#features" class="nav-link">Features</a>
        <a href="/verify" class="nav-link">Verify</a>
        <a href="/mint" class="nav-link">Mint</a>
        <a href="/my-warranties" class="nav-link">My Warranties</a>
      </nav>

      <div class="nav-actions">
        {#if web3State.isConnected}
          <button
            onclick={() => web3State.disconnect()}
            class="btn-wallet btn-wallet--connected"
          >
            <span class="wallet-dot wallet-dot--active" aria-hidden="true"></span>
            <Wallet size={14} />
            {web3State.address?.slice(0, 6)}…{web3State.address?.slice(-4)}
          </button>
        {:else}
          <button
            onclick={() => web3State.connect()}
            disabled={web3State.isConnecting}
            class="btn-wallet"
          >
            <Wallet size={14} />
            {web3State.isConnecting ? 'Connecting…' : 'Connect Wallet'}
          </button>
        {/if}
      </div>
    </div>
  </header>

  <!-- ── Hero ── -->
  <main>
    <section class="hero container">
      <div class="hero-text animate-fade-in-up">
        <div class="badge">
          <span class="badge-dot" aria-hidden="true"></span>
          Live on Ethereum Sepolia
        </div>

        <h1 class="hero-heading">
          Tokenizing<br />
          <span class="gradient-text">Real World Assets.</span>
        </h1>

        <p class="hero-sub">
          Bridge the gap between physical products and Web3.
          Tokenize product warranties as RWAs — immutable, verifiable, and
          freely tradable on-chain.
        </p>

        <div class="hero-cta">
          <a href="/mint" class="btn-primary btn-lg">
            Mint a Warranty
            <ArrowRight size={16} />
          </a>
          <a href="/verify" class="btn-secondary btn-lg">
            Verify Now
            <ChevronRight size={16} />
          </a>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">10k+</div>
            <div class="stat-label">Warranties Minted</div>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat">
            <div class="stat-value">$2M+</div>
            <div class="stat-label">Value Secured</div>
          </div>
          <div class="stat-divider" aria-hidden="true"></div>
          <div class="stat">
            <div class="stat-value">100%</div>
            <div class="stat-label">Immutable</div>
          </div>
        </div>
      </div>

      <!-- Visual card -->
      <div class="hero-visual" aria-hidden="true">
        <div class="orbit orbit-outer"></div>
        <div class="orbit orbit-inner"></div>
        <div class="nft-card">
          <div class="nft-card-header">
            <ShieldCheck size={20} />
            <span>Warrant3 NFT</span>
          </div>
          <div class="nft-card-body">
            <div class="nft-row">
              <span class="nft-label">Product</span>
              <span class="nft-value">ASUS ROG Strix G15</span>
            </div>
            <div class="nft-row">
              <span class="nft-label">Serial No.</span>
              <span class="nft-value mono">SN-98234-XYZ</span>
            </div>
            <div class="nft-row">
              <span class="nft-label">Expiry</span>
              <span class="nft-value">Oct 12, 2027</span>
            </div>
            <div class="nft-row">
              <span class="nft-label">Status</span>
              <span class="status-badge">
                <CheckCircle size={12} />
                Active
              </span>
            </div>
          </div>
          <div class="nft-card-footer">
            <span class="nft-label">Owner</span>
            <span class="nft-value mono">0x71C9…97d1</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ── -->
    <section id="features" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Why Blockchain Warranties?</h2>
          <p class="section-sub">
            Traditional warranties are easy to lose, hard to transfer, and easily forged.
            We solve this with web3 technology.
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon feature-icon--blue">
              <ShieldCheck size={22} />
            </div>
            <h3 class="feature-title">Physical-to-Digital RWA</h3>
            <p class="feature-desc">
              Anchor your physical products to the blockchain. Every warranty acts as a
              cryptographic proof of your Real World Asset ownership, forever.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon--purple">
              <Link size={22} />
            </div>
            <h3 class="feature-title">Seamless Transfers</h3>
            <p class="feature-desc">
              Selling your item? The warranty goes with it. Transfer the NFT to the
              new owner in seconds — no paperwork, no middlemen.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon feature-icon--cyan">
              <Zap size={22} />
            </div>
            <h3 class="feature-title">Instant Verification</h3>
            <p class="feature-desc">
              Brands and repair shops can instantly verify the authenticity and status
              of any warranty directly on-chain, anytime.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA Banner ── -->
    <section class="cta-banner container">
      <div class="cta-card">
        <div class="cta-content">
          <h2 class="cta-title">Ready to tokenize your first warranty?</h2>
          <p class="cta-sub">Connect your wallet and mint in under 2 minutes.</p>
        </div>
        <a href="/mint" class="btn-primary btn-lg">
          Get Started
          <ArrowRight size={16} />
        </a>
      </div>
    </section>
  </main>

  <!-- ── Footer ── -->
  <footer class="footer">
    <div class="container footer-inner">
      <div class="brand brand--sm">
        <ShieldCheck size={18} />
        <span>Warrant3</span>
      </div>
      <p class="footer-copy">© 2026 Warrant3. Built on Ethereum.</p>
    </div>
  </footer>
</div>

<style>
  /* ── Root & Layout ── */
  .root {
    min-height: 100vh;
    background-color: #0A0A0A;
    color: #FFFFFF;
    font-family: 'Poppins', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .container {
    width: 100%;
    max-width: 1180px;
    margin-inline: auto;
    padding-inline: 24px;
  }

  /* ── Ambient glows ── */
  .glow {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(120px);
  }
  .glow-top {
    top: -200px;
    left: -200px;
    width: 600px;
    height: 600px;
    background: rgba(96, 165, 250, 0.06);
  }
  .glow-bottom {
    bottom: -200px;
    right: -200px;
    width: 500px;
    height: 500px;
    background: rgba(20, 71, 230, 0.07);
  }

  /* ── Navbar ── */
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(10, 10, 10, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(100, 116, 139, 0.15);
    height: 60px;
    display: flex;
    align-items: center;
  }
  .navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #FFFFFF;
    text-decoration: none;
    letter-spacing: -0.3px;
  }
  .brand :global(svg) {
    color: #60A5FA;
    flex-shrink: 0;
  }
  .brand--sm {
    font-size: 15px;
    color: #D1D5DB;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #D1D5DB;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 6px;
    transition: color 200ms ease, background 200ms ease;
  }
  .nav-link:hover {
    color: #FFFFFF;
    background: rgba(96, 165, 250, 0.08);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Wallet Button ── */
  .btn-wallet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #262626;
    background: transparent;
    color: #D1D5DB;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-wallet:hover:not(:disabled) {
    border-color: #60A5FA;
    color: #FFFFFF;
    background: rgba(96, 165, 250, 0.08);
  }
  .btn-wallet:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-wallet--connected {
    border-color: rgba(16, 185, 129, 0.4);
    color: #10B981;
    background: rgba(16, 185, 129, 0.06);
  }
  .btn-wallet--connected:hover {
    border-color: #E40014 !important;
    color: #E40014 !important;
    background: rgba(228, 0, 20, 0.06) !important;
  }

  .wallet-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .wallet-dot--active {
    background: #10B981;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); }
    50%       { box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); }
  }

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
    transition: background 200ms ease, box-shadow 200ms ease, transform 200ms ease;
  }
  .btn-primary:hover {
    background: #1035C1;
    box-shadow: 0 4px 16px rgba(20, 71, 230, 0.45);
    color: #FFFFFF;
    transform: translateY(-1px);
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 8px;
    border: 1px solid #262626;
    background: transparent;
    color: #D1D5DB;
    text-decoration: none;
    cursor: pointer;
    transition: all 200ms ease;
  }
  .btn-secondary:hover {
    border-color: #60A5FA;
    color: #FFFFFF;
    background: rgba(96, 165, 250, 0.06);
    transform: translateY(-1px);
  }

  .btn-lg {
    padding: 13px 28px;
    font-size: 15px;
  }

  /* ── Hero ── */
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
    padding-top: 80px;
    padding-bottom: 80px;
    position: relative;
    z-index: 1;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 500;
    color: #60A5FA;
    background: rgba(96, 165, 250, 0.08);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 999px;
    padding: 6px 14px;
    width: fit-content;
  }
  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #60A5FA;
    animation: pulse-dot 2s infinite;
  }

  .hero-heading {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -1px;
    color: #FFFFFF;
  }
  .gradient-text {
    background: linear-gradient(135deg, #60A5FA 0%, #1447E6 60%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 16px;
    font-weight: 400;
    color: #D1D5DB;
    line-height: 1.7;
    max-width: 480px;
  }

  .hero-cta {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stats {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-top: 24px;
    margin-top: 8px;
    border-top: 1px solid #262626;
  }
  .stat { text-align: left; }
  .stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: -0.5px;
  }
  .stat-label {
    font-size: 12px;
    color: #64748B;
    margin-top: 2px;
  }
  .stat-divider {
    width: 1px;
    height: 36px;
    background: #262626;
    flex-shrink: 0;
  }

  /* ── Hero visual / NFT card ── */
  .hero-visual {
    position: relative;
    height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .orbit {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(96, 165, 250, 0.08);
  }
  .orbit-outer {
    width: 380px;
    height: 380px;
    animation: spin 40s linear infinite;
  }
  .orbit-inner {
    width: 270px;
    height: 270px;
    border-color: rgba(20, 71, 230, 0.1);
    animation: spin 25s linear infinite reverse;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .nft-card {
    position: relative;
    z-index: 2;
    background: #171717;
    border: 1px solid #262626;
    border-radius: 16px;
    padding: 24px;
    width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(96, 165, 250, 0.05);
    transition: transform 300ms ease, box-shadow 300ms ease;
  }
  .nft-card:hover {
    transform: translateY(-6px) rotate(1deg);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(96, 165, 250, 0.1);
  }

  .nft-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #60A5FA;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #262626;
  }

  .nft-card-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .nft-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .nft-label {
    font-size: 11px;
    color: #64748B;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }
  .nft-value {
    font-size: 12px;
    color: #D1D5DB;
    font-weight: 500;
    text-align: right;
  }
  .mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11px;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 999px;
    padding: 3px 10px;
  }

  .nft-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #262626;
  }

  /* ── Features ── */
  .features-section {
    position: relative;
    z-index: 1;
    border-top: 1px solid #262626;
    background: #0D0D0D;
    padding: 80px 0;
  }

  .section-header {
    text-align: center;
    margin-bottom: 56px;
  }
  .section-title {
    font-size: 32px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }
  .section-sub {
    font-size: 16px;
    color: #64748B;
    max-width: 520px;
    margin-inline: auto;
    line-height: 1.6;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .feature-card {
    background: #171717;
    border: 1px solid #262626;
    border-radius: 12px;
    padding: 28px;
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
  }
  .feature-card:hover {
    border-color: #64748B;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    transform: translateY(-3px);
  }

  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
  .feature-icon--blue {
    background: rgba(96, 165, 250, 0.1);
    border: 1px solid rgba(96, 165, 250, 0.2);
    color: #60A5FA;
  }
  .feature-icon--purple {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: #A78BFA;
  }
  .feature-icon--cyan {
    background: rgba(20, 71, 230, 0.1);
    border: 1px solid rgba(20, 71, 230, 0.2);
    color: #60A5FA;
  }

  .feature-title {
    font-size: 17px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 10px;
  }
  .feature-desc {
    font-size: 14px;
    color: #64748B;
    line-height: 1.65;
  }

  /* ── CTA Banner ── */
  .cta-banner {
    position: relative;
    z-index: 1;
    padding: 64px 24px;
  }
  .cta-card {
    background: linear-gradient(135deg, rgba(20, 71, 230, 0.12) 0%, rgba(96, 165, 250, 0.06) 100%);
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 16px;
    padding: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }
  .cta-title {
    font-size: 24px;
    font-weight: 600;
    color: #FFFFFF;
    margin-bottom: 8px;
    letter-spacing: -0.3px;
  }
  .cta-sub {
    font-size: 15px;
    color: #64748B;
  }

  /* ── Footer ── */
  .footer {
    position: relative;
    z-index: 1;
    border-top: 1px solid #262626;
    padding: 24px;
  }
  .footer-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .footer-copy {
    font-size: 13px;
    color: #64748B;
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 48px;
      padding-top: 48px;
    }
    .hero-visual {
      display: none;
    }
    .features-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .features-grid { grid-template-columns: 1fr; }
    .cta-card {
      flex-direction: column;
      text-align: center;
      padding: 32px 24px;
    }
    .stats { flex-direction: column; align-items: flex-start; gap: 12px; }
    .stat-divider { width: 40px; height: 1px; }
  }

  @media (max-width: 480px) {
    .hero { padding-top: 32px; padding-bottom: 48px; }
    .hero-cta { flex-direction: column; }
    .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
  }
</style>
