import { createConfig, http, reconnect, injected, fallback } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'

// createConfig must run only on the client side.
// On the server (SSR/Node), injected() tries to access window.ethereum which throws.
const isBrowser = typeof window !== 'undefined'

export const config = createConfig({
  chains: [sepolia],
  // Only register the injected connector on the client
  connectors: isBrowser ? [injected()] : [],
  transports: {
    [sepolia.id]: fallback([
      http('https://sepolia.gateway.tenderly.co'),
      http('https://sepolia.drpc.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
    ]),
  },
  // Disable SSR — all state is client-side
  ssr: false,
})

// Auto reconnect on client side initialization
if (isBrowser) {
  reconnect(config)
}
