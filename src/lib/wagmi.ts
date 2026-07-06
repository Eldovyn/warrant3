import { createConfig, http, reconnect, injected, fallback } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: fallback([
      http('https://sepolia.gateway.tenderly.co'),
      http('https://sepolia.drpc.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
    ]),
  },
})

// Auto reconnect on client side initialization
if (typeof window !== 'undefined') {
  reconnect(config)
}
