<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { ShieldCheck, Link, Zap, ChevronRight, Wallet } from '@lucide/svelte';
  import { web3State } from "$lib/web3.svelte";
</script>

<div class="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-hidden relative font-sans">
  <!-- Glowing background elements -->
  <div class="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/20 blur-[120px] rounded-full pointer-events-none"></div>

  <!-- Navbar -->
  <header class="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
    <div class="flex items-center gap-2">
      <ShieldCheck class="w-8 h-8 text-indigo-400" />
      <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
        Warrant3
      </span>
    </div>
    <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
      <a href="#features" class="hover:text-white transition-colors">Features</a>
      <a href="/verify" class="hover:text-white transition-colors">Verify Warranty</a>
      <a href="/mint" class="hover:text-white transition-colors">Mint</a>
      <a href="/my-warranties" class="hover:text-white transition-colors">My Warranties</a>
    </nav>
    
    {#if web3State.isConnected}
      <Button 
        onclick={() => web3State.disconnect()}
        class="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all duration-300 gap-2 rounded-full px-6"
      >
        <Wallet class="w-4 h-4" />
        {web3State.address?.slice(0, 6)}...{web3State.address?.slice(-4)}
      </Button>
    {:else}
      <Button 
        onclick={() => web3State.connect()}
        disabled={web3State.isConnecting}
        class="bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-indigo-500/50 transition-all duration-300 gap-2 rounded-full px-6"
      >
        <Wallet class="w-4 h-4" />
        {web3State.isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    {/if}
  </header>

  <!-- Hero Section -->
  <main class="relative z-10 container mx-auto px-6 pt-20 pb-32">
    <div class="grid lg:grid-cols-2 gap-16 items-center">
      
      <!-- Text Content -->
      <div class="space-y-8">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-indigo-300 backdrop-blur-sm">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Live on Ethereum
        </div>
        
        <h1 class="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
          Tokenizing <br/>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Real World Assets.
          </span>
        </h1>
        
        <p class="text-lg text-slate-400 max-w-xl leading-relaxed">
          Bridge the gap between physical products and Web3. Tokenize product warranties as Real World Assets (RWA) to make them immutable, verifiable, and freely tradable on-chain.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 pt-4">
          <Button href="/mint" size="lg" class="bg-white text-slate-950 hover:bg-slate-200 rounded-full text-base font-semibold px-8 h-12 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Mint a Warranty
          </Button>
          <Button href="/verify" size="lg" variant="outline" class="border-white/10 bg-white/5 hover:bg-white/5 hover:text-white backdrop-blur-sm rounded-full text-base font-semibold px-8 h-12 gap-2 text-white">
            Verify Now
            <ChevronRight class="w-4 h-4" />
          </Button>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-3 gap-6 border-t border-white/10 pt-8 mt-12">
          <div>
            <div class="text-3xl font-bold text-white">10k+</div>
            <div class="text-sm text-slate-400 mt-1">Warranties Minted</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">$2M+</div>
            <div class="text-sm text-slate-400 mt-1">Value Secured</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">100%</div>
            <div class="text-sm text-slate-400 mt-1">Immutable</div>
          </div>
        </div>
      </div>

      <!-- Image / Graphic -->
      <div class="relative w-full h-[600px] flex items-center justify-center" style="perspective: 1000px;">
        <!-- Decoration rings -->
        <div class="absolute w-[120%] h-[120%] border border-white/5 rounded-full animate-[spin_40s_linear_infinite]"></div>
        <div class="absolute w-[90%] h-[90%] border border-indigo-500/10 rounded-full animate-[spin_30s_linear_infinite_reverse]"></div>
        
        <!-- The NFT Card -->
        <div class="relative w-72 sm:w-96 aspect-[3/4] rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-transparent p-1 shadow-[0_0_50px_rgba(79,70,229,0.3)] backdrop-blur-md transition-transform duration-700 hover:scale-105 hover:-rotate-y-12 hover:rotate-x-12 group">
          <img src="/nft_card.png" alt="NFT Warranty Card" class="w-full h-full object-cover rounded-xl" />
          
          <!-- Glossy overlay -->
          <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>
    </div>
  </main>

  <!-- Features Section -->
  <section id="features" class="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-3xl py-24">
    <div class="container mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-5xl font-bold mb-4">Why Blockchain Warranties?</h2>
        <p class="text-slate-400 max-w-2xl mx-auto">Traditional warranties are easy to lose, hard to transfer, and easily forged. We solve this with web3 technology.</p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <ShieldCheck class="w-32 h-32 text-indigo-500 -mr-10 -mt-10" />
          </div>
          <div class="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-6 border border-indigo-500/30">
            <ShieldCheck class="w-6 h-6 text-indigo-400" />
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Physical-to-Digital RWA</h3>
          <p class="text-slate-400 leading-relaxed">Anchor your physical products to the blockchain. Every warranty acts as a cryptographic proof of your Real World Asset ownership, forever.</p>
        </div>
        
        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Link class="w-32 h-32 text-purple-500 -mr-10 -mt-10" />
          </div>
          <div class="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
            <Link class="w-6 h-6 text-purple-400" />
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Easy Transfers</h3>
          <p class="text-slate-400 leading-relaxed">Selling your item? The warranty goes with it. Transfer the NFT to the new owner in seconds.</p>
        </div>
        
        <div class="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Zap class="w-32 h-32 text-pink-500 -mr-10 -mt-10" />
          </div>
          <div class="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-6 border border-pink-500/30">
            <Zap class="w-6 h-6 text-pink-400" />
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Instant Verification</h3>
          <p class="text-slate-400 leading-relaxed">Brands and repair shops can instantly verify the authenticity and status of the warranty on-chain.</p>
        </div>
      </div>
    </div>
  </section>
</div>
