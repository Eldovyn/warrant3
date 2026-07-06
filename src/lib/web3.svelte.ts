import { getAccount, watchAccount, connect, disconnect, injected } from '@wagmi/core'
import { config } from './wagmi'

class Web3State {
  address = $state<`0x${string}` | null>(null)
  isConnected = $state<boolean>(false)
  isConnecting = $state<boolean>(false)
  chainId = $state<number | null>(null)

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize with current account state
      const account = getAccount(config)
      this.address = account.address || null
      this.isConnected = account.isConnected
      this.chainId = account.chainId || null

      // Watch for changes
      watchAccount(config, {
        onChange: (account) => {
          this.address = account.address || null
          this.isConnected = account.isConnected
          this.chainId = account.chainId || null
        }
      })
    }
  }

  async connect() {
    if (this.isConnected) return
    this.isConnecting = true
    try {
      await connect(config, { connector: injected() })
    } catch (e) {
      console.error('Failed to connect wallet:', e)
    } finally {
      this.isConnecting = false
    }
  }

  async disconnect() {
    if (!this.isConnected) return
    try {
      await disconnect(config)
    } catch (e) {
      console.error('Failed to disconnect wallet:', e)
    }
  }
}

export const web3State = new Web3State()
