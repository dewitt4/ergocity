// src/services/walletConnect.js
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import Web3 from 'web3';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error("FATAL ERROR: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. WalletConnect will not work.");
}

const metadata = {
  name: 'ErgoCity DApp',
  description: 'ErgoCity - Experience the mathematical beauty of ergodicity',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://ergocity.gorillaether.com', // Fallback for server-side
  icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://ergocity.gorillaether.com'}/favicon.ico`]
};

// Configure for Polygon Mainnet
const POLYGON_MAINNET_CHAIN_ID = 137;
const POLYGON_MAINNET_RPC_URL = process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC_URL;

if (!POLYGON_MAINNET_RPC_URL && projectId) {
    console.warn("NEXT_PUBLIC_POLYGON_MAINNET_RPC_URL is not set. WalletConnect might have issues if the wallet doesn't provide its own RPC for Polygon Mainnet.");
}

const supportedChainsNumerical = [POLYGON_MAINNET_CHAIN_ID];
const defaultChainNumerical = POLYGON_MAINNET_CHAIN_ID;

const rpcMap = {
  [POLYGON_MAINNET_CHAIN_ID]: POLYGON_MAINNET_RPC_URL,
};

let providerInstance = null; // Singleton for EthereumProvider
let web3InstanceForWC = null; // Singleton for Web3 instance tied to WC

async function initializeProvider() {
  if (!projectId) {
    console.error("WalletConnect projectId is missing for initialization.");
    return null;
  }
  // Avoid re-initialization if already initialized and possibly connected
  if (providerInstance) {
    if (!web3InstanceForWC && providerInstance.session) { // Or providerInstance.connected
        web3InstanceForWC = new Web3(providerInstance);
    }
    return providerInstance;
  }

  try {
    console.log("Initializing new WalletConnect EthereumProvider instance for Polygon Mainnet...");
    providerInstance = await EthereumProvider.init({
      projectId,
      chains: [defaultChainNumerical],
      optionalChains: supportedChainsNumerical,
      rpcMap: (POLYGON_MAINNET_RPC_URL && Object.keys(rpcMap).length > 0) ? rpcMap : undefined,
      metadata,
      showQrModal: true,
    });
    console.log("EthereumProvider initialized:", providerInstance);
    // Create Web3 instance immediately after provider initialization
    if (providerInstance) {
        web3InstanceForWC = new Web3(providerInstance);
    }
    return providerInstance;
  } catch (error) {
    console.error("Failed to initialize WalletConnect EthereumProvider:", error);
    providerInstance = null;
    web3InstanceForWC = null;
    return null;
  }
}

export async function getWalletConnectProvider() {
  if (!providerInstance) {
    await initializeProvider();
  }
  return providerInstance;
}

export async function restoreWalletConnectSession() {
  console.log("Attempting to restore WalletConnect session...");
  const currentProvider = await getWalletConnectProvider(); // Ensures provider is initialized

  if (!currentProvider) {
    console.log("WC Provider not available for session restore attempt.");
    return null;
  }

  // EthereumProvider v2 should auto-restore if session exists in localStorage.
  // We check its state after it had a chance to initialize.
  if (currentProvider.session && currentProvider.accounts?.length > 0) {
    console.log("WalletConnect session found active/restored by provider. Accounts:", currentProvider.accounts, "ChainId:", currentProvider.chainId);
    if (!web3InstanceForWC) web3InstanceForWC = new Web3(currentProvider);
    return {
      accounts: currentProvider.accounts,
      chainId: currentProvider.chainId,
      web3: web3InstanceForWC,
      provider: currentProvider,
    };
  }

  console.log("No active WalletConnect session found by checking provider state after initialization.");
  return null;
}

export async function connectWallet() {
  console.log("User initiated WalletConnect connection...");
  const currentProvider = await getWalletConnectProvider();

  if (!currentProvider) {
    console.error("WalletConnect provider not initialized. Cannot connect.");
    throw new Error("WalletConnect provider not initialized.");
  }

  return new Promise(async (resolve, reject) => {
    if (currentProvider.session && currentProvider.accounts?.length > 0) {
      console.log("WalletConnect already connected (connectWallet). Accounts:", currentProvider.accounts);
      if (!web3InstanceForWC) web3InstanceForWC = new Web3(currentProvider);
      resolve({ accounts: currentProvider.accounts, chainId: currentProvider.chainId, web3: web3InstanceForWC, provider: currentProvider });
      return;
    }

    let didResolve = false;

    const onConnect = ({ chainId: connectedChainId }) => {
      if (didResolve) return;
      cleanupListeners();
      if (currentProvider.accounts && currentProvider.accounts.length > 0) {
        didResolve = true;
        console.log("WalletConnect 'connect' event. Accounts:", currentProvider.accounts, "ChainId:", currentProvider.chainId);
        if (!web3InstanceForWC) web3InstanceForWC = new Web3(currentProvider);
        resolve({ accounts: currentProvider.accounts, chainId: currentProvider.chainId, web3: web3InstanceForWC, provider: currentProvider });
      } else {
        didResolve = true;
        reject(new Error("WalletConnect connected via event but no accounts."));
      }
    };

    const onModalCloseOrDisconnect = () => {
      if (didResolve) return;
      cleanupListeners();
      didResolve = true;
      console.log("WalletConnect modal closed or disconnected during attempt.");
      reject(new Error("Connection modal closed or disconnected."));
    };
    
    const cleanupListeners = () => {
        currentProvider.removeListener('connect', onConnect);
        currentProvider.removeListener('disconnect', onModalCloseOrDisconnect);
    };

    currentProvider.on('connect', onConnect);
    currentProvider.on('disconnect', onModalCloseOrDisconnect); // Catches modal close before session OR session disconnect

    try {
      console.log("Calling WalletConnect provider.connect()...");
      await currentProvider.connect(); // This will show QR modal if no session
      // If .connect() resolves and events haven't fired, it implies session restoration or very fast connection
      if (!didResolve && currentProvider.session && currentProvider.accounts?.length > 0) {
        console.log("WalletConnect .connect() resolved directly with session. Accounts:", currentProvider.accounts);
        cleanupListeners(); // Call cleanup as we are resolving
        didResolve = true;
        if (!web3InstanceForWC) web3InstanceForWC = new Web3(currentProvider);
        resolve({ accounts: currentProvider.accounts, chainId: currentProvider.chainId, web3: web3InstanceForWC, provider: currentProvider });
      } else if (!didResolve && !currentProvider.session) {
        console.log("WalletConnect .connect() resolved but no session (modal likely closed before connecting).");
        // The 'disconnect' event (onModalCloseOrDisconnect) should handle this.
      }
    } catch (error) {
      if (didResolve) return;
      console.error("Error during WalletConnect provider.connect() call:", error);
      cleanupListeners();
      didResolve = true;
      if (error.message.toLowerCase().includes('user rejected') || error.code === 4001) {
        reject(new Error("Connection request rejected by user."));
      } else if (error.message.toLowerCase().includes('modal closed')) {
         reject(new Error("Connection modal closed."));
      } else {
        reject(error);
      }
    }
  });
}

export async function disconnectWallet() {
  if (providerInstance?.session) { // Check the singleton instance
    try {
      console.log("Disconnecting WalletConnect session (user initiated)...");
      await providerInstance.disconnect();
      console.log("WalletConnect session disconnected successfully by user.");
    } catch (error) {
      console.error("Failed to disconnect WalletConnect session:", error);
    }
  } else {
    console.log("No active WalletConnect session on providerInstance to disconnect.");
  }
  // Clear our singleton instances to allow for fresh initialization if needed
  providerInstance = null;
  web3InstanceForWC = null;
}