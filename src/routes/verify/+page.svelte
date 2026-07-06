<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    ShieldCheck,
    Search,
    ChevronLeft,
    CheckCircle2,
    Loader2,
  } from "@lucide/svelte";
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

      // 1. Get warranty details
      const details = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "getWarrantyDetails",
        args: [tokenId],
      })) as any;

      const details_productId =
        details.productId !== undefined ? details.productId : details[0];
      const details_serialNumber =
        details.serialNumber !== undefined ? details.serialNumber : details[1];
      const details_activationTime =
        details.activationTime !== undefined
          ? details.activationTime
          : details[2];
      const details_duration =
        details.duration !== undefined ? details.duration : details[3];

      // 2. Get owner address
      const owner = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "ownerOf",
        args: [tokenId],
      })) as `0x${string}`;

      // 3. Get warranty active status
      const isActive = (await readContract(config, {
        chainId: sepolia.id,
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: WarrantyNFTAbi,
        functionName: "isWarrantyActive",
        args: [tokenId],
      })) as boolean;

      // 4. Get token URI and fetch metadata from IPFS
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
        expiryDate = new Date(
          (Number(details_activationTime) + Number(details_duration)) * 1000,
        );
      } else {
        expiryDate = new Date(activationDate.getTime());
        expiryDate.setMonth(expiryDate.getMonth() + Number(details_duration));
      }

      result = {
        tokenId: tokenId.toString(),
        productId: details_productId,
        serialNumber: details_serialNumber,
        activationDate: activationDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        expiryDate: expiryDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        owner,
        isActive,
        metadata,
      };
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("ERC721NonexistentToken")) {
        errorMsg = "This token ID does not exist or has not been minted yet.";
      } else {
        errorMsg =
          "Token ID not found or contract read failed. Please check the ID and try again.";
      }
    } finally {
      isVerifying = false;
    }
  }
</script>

<div
  class="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 overflow-hidden relative font-sans"
>
  <div
    class="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"
  ></div>
  <div
    class="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"
  ></div>

  <header
    class="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5"
  >
    <a
      href="/"
      class="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
    >
      <ChevronLeft class="w-5 h-5" />
      <span class="font-medium">Back to Home</span>
    </a>
    <div class="flex items-center gap-2">
      <ShieldCheck class="w-6 h-6 text-indigo-400" />
      <span
        class="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight"
      >
        Warrant3
      </span>
    </div>
  </header>

  <main
    class="relative z-10 container mx-auto px-6 pt-20 pb-32 flex flex-col items-center"
  >
    <div class="text-center max-w-2xl mx-auto mb-12">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6"
      >
        <Search class="w-8 h-8 text-indigo-400" />
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
        Verify Warranty
      </h1>
      <p class="text-slate-400 text-lg">
        Enter the NFT Token ID or physical serial number to verify the
        authenticity and status of your warranty on the blockchain.
      </p>
    </div>

    <!-- Search Box -->
    <form
      onsubmit={handleVerify}
      class="w-full max-w-xl bg-white/[0.02] border border-white/10 rounded-2xl p-1.5 sm:p-2 flex items-center shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
    >
      <Search class="w-5 h-5 text-slate-400 ml-3 mr-2 shrink-0" />
      <input
        type="text"
        bind:value={searchTokenId}
        placeholder="Enter Token ID (e.g. 1)"
        class="flex-1 min-w-0 bg-transparent border-none outline-none text-white placeholder-slate-500 py-3 sm:py-4 text-base sm:text-lg"
        required
      />
      <Button
        type="submit"
        disabled={isVerifying}
        class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 sm:px-8 py-3 sm:py-6 h-auto text-sm sm:text-base font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)] shrink-0"
      >
        {#if isVerifying}
          <Loader2 class="w-4 h-4 animate-spin mr-2 inline" />
          Verifying...
        {:else}
          Verify
        {/if}
      </Button>
    </form>

    {#if errorMsg}
      <div
        class="w-full max-w-xl mt-8 text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 py-3 px-6 rounded-xl"
      >
        {errorMsg}
      </div>
    {/if}

    <!-- Result Card -->
    {#if result}
      <div
        class="w-full max-w-xl mt-12 p-1 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent"
      >
        <div
          class="bg-slate-950/80 backdrop-blur-xl rounded-xl p-5 sm:p-8 border border-white/5 space-y-6"
        >
          {#if result.metadata?.image}
            <div
              class="w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center"
            >
              <img
                src={result.metadata.image.replace(
                  "ipfs://",
                  "https://ipfs.io/ipfs/",
                )}
                alt={result.productId}
                class="w-full h-full object-contain"
              />
            </div>
          {/if}

          <div
            class="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 sm:gap-0"
          >
            <div>
              <div class="flex items-center gap-2 mb-2">
                {#if result.isActive}
                  <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0" />
                  <span
                    class="text-emerald-400 font-semibold tracking-wide uppercase text-xs sm:text-sm"
                    >Authentic Warranty</span
                  >
                {:else}
                  <span
                    class="text-rose-400 font-semibold tracking-wide uppercase text-xs sm:text-sm"
                    >Expired / Inactive Warranty</span
                  >
                {/if}
              </div>
              <h3
                class="text-xl sm:text-2xl font-bold text-white leading-tight"
              >
                {result.productId}
              </h3>
            </div>
            <div class="text-left sm:text-right shrink-0">
              <div
                class="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1"
              >
                Token ID
              </div>
              <div
                class="font-mono text-xs sm:text-sm text-indigo-300 bg-indigo-500/10 px-3 py-1 inline-block sm:block rounded-md border border-indigo-500/20"
              >
                #{result.tokenId}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-between py-3 border-b border-white/5">
              <span class="text-slate-400">Owner</span>
              <span class="text-white font-mono text-xs sm:text-sm">
                {result.owner.slice(0, 8)}...{result.owner.slice(-6)}
              </span>
            </div>
            <div class="flex justify-between py-3 border-b border-white/5">
              <span class="text-slate-400">Serial Number</span>
              <span class="text-white font-medium">{result.serialNumber}</span>
            </div>
            <div class="flex justify-between py-3 border-b border-white/5">
              <span class="text-slate-400">Minted Date</span>
              <span class="text-white">{result.activationDate}</span>
            </div>
            <div class="flex justify-between py-3 border-b border-white/5">
              <span class="text-slate-400">Expiry Date</span>
              <span class="text-white">{result.expiryDate}</span>
            </div>
            {#if result.metadata?.description}
              <div class="py-3 text-slate-400 text-sm">
                <div class="font-medium text-slate-300 mb-1">Description</div>
                <p class="text-slate-400 mt-1 leading-relaxed">
                  {result.metadata.description}
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>
