// src/pages/_app.js
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import Head from 'next/head';
import ErgoCityABI from '@/abis/ErgoCityABI.json';
import '../styles/globals.css';

// Import your Layout component
import Layout from '@/components/Layout'; // Ensure this path is correct

import {
  getWalletConnectProvider,
  restoreWalletConnectSession,
  connectWallet as connectWithWalletConnectService,
  disconnectWallet as disconnectFromWalletConnectService,
} from '@/services/walletConnect';

// --- Context Definition with Diagnostics ---
const DEFAULT_CONTEXT_STATE = {
  account: null,
  web3: null,
  contract: null,
  isConnecting: false,
  isRestoringSession: true,
  chainId: null,
  balance: '0',
  connectWithMetaMask: () => console.error("Web3Provider (default context): MetaMask function called before provider ready."),
  connectWithWalletConnect: () => console.error("Web3Provider (default context): WalletConnect function called before provider ready."),
  disconnectWallet: () => console.error("Web3Provider (default context): Disconnect function called before provider ready."),
  isConnected: false,
  providerType: null,
  _isDefaultContext: true // Flag to identify if this is the default uninitialized context
};

const Web3Context = createContext(DEFAULT_CONTEXT_STATE);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    console.error("CRITICAL: useWeb3 context is completely null/undefined!");
    return DEFAULT_CONTEXT_STATE; // Prevent crash
  }
  if (context._isDefaultContext) {
    console.warn("useWeb3 is using the DEFAULT context value. Web3Provider might not be an ancestor or its value isn't ready.");
  }
  return context;
};
// --- End Context Definition ---

const LAST_PROVIDER_TYPE_KEY = 'ergocityDAppLastProviderType';

function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [providerType, setProviderType] = useState(null);
  const [activeProviderInstance, setActiveProviderInstance] = useState(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const CONTRACT_ABI = ErgoCityABI;

  const clearState = useCallback(() => {
    console.log("Clearing Web3 state...");
    setAccount(null);
    setWeb3(null);
    setContract(null);
    setChainId(null);
    setBalance('0');
    setProviderType(null);
    setActiveProviderInstance(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAST_PROVIDER_TYPE_KEY);
    }
  }, []);

  const setupWeb3AndContract = useCallback(async (currentWeb3, currentAccount, currentChainIdNum, currentProviderType) => {
    console.log(`Setting up Web3/Contract for ${currentProviderType}. Account: ${currentAccount}, ChainID: ${currentChainIdNum}`);
    setWeb3(currentWeb3);
    setAccount(currentAccount);
    setChainId(Number(currentChainIdNum));
    setProviderType(currentProviderType);
    try {
      const currentBalanceWei = await currentWeb3.eth.getBalance(currentAccount);
      setBalance(currentWeb3.utils.fromWei(currentBalanceWei, 'ether'));
      if (CONTRACT_ADDRESS && CONTRACT_ABI && CONTRACT_ABI.length > 0) {
        const contractInstance = new currentWeb3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        setContract(contractInstance);
        console.log("Contract instance created:", contractInstance.options.address);
      } else {
        console.warn("CONTRACT_ADDRESS or ABI missing. Contract not initialized.");
      }
    } catch (error) {
      console.error("Error in setupWeb3AndContract (e.g., fetching balance):", error);
    }
  }, [CONTRACT_ADDRESS, CONTRACT_ABI]);

  const connectWithMetaMask = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!'); return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const { Web3 } = await import('web3');
        const web3Instance = new Web3(window.ethereum);
        const currentChainId = await web3Instance.eth.getChainId();
        await setupWeb3AndContract(web3Instance, accounts[0], Number(currentChainId), 'metamask');
        setActiveProviderInstance(window.ethereum);
        localStorage.setItem(LAST_PROVIDER_TYPE_KEY, 'metamask');
      }
    } catch (error) {
      console.error('Error connecting with MetaMask:', error);
      if (error.code !== 4001) alert('Failed to connect MetaMask.');
    } finally {
      setIsConnecting(false);
    }
  }, [setupWeb3AndContract]);

  const connectWithWalletConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connection = await connectWithWalletConnectService();
      if (connection && connection.accounts && connection.accounts.length > 0) {
        await setupWeb3AndContract(connection.web3, connection.accounts[0], Number(connection.chainId), 'walletconnect');
        setActiveProviderInstance(connection.provider);
        localStorage.setItem(LAST_PROVIDER_TYPE_KEY, 'walletconnect');
      } else {
        console.log("WalletConnect connection did not resolve with accounts or was cancelled.");
      }
    } catch (error) {
      console.error('Error connecting with WalletConnect in _app.js:', error);
      if (error.message && !error.message.toLowerCase().includes('modal closed') && !error.message.toLowerCase().includes('rejected')) {
        alert(`Failed to connect WalletConnect: ${error.message || 'Please try again.'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [setupWeb3AndContract]);

  const disconnectWallet = useCallback(async () => {
    console.log(`Disconnecting from ${providerType} in _app.js...`);
    const currentActiveProvider = activeProviderInstance;
    const currentProviderType = providerType;
    clearState();
    if (currentProviderType === 'walletconnect' && currentActiveProvider) {
      await disconnectFromWalletConnectService();
    }
    console.log("Wallet disconnected, DApp state cleared.");
  }, [providerType, activeProviderInstance, clearState]);

  useEffect(() => {
    const attemptAutoConnect = async () => {
      console.log("Attempting auto-connect on app load...");
      setIsRestoringSession(true);
      const lastProvider = localStorage.getItem(LAST_PROVIDER_TYPE_KEY);
      console.log("Last connected provider type from localStorage:", lastProvider);
      if (lastProvider === 'metamask' && typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWithMetaMask();
          } else { localStorage.removeItem(LAST_PROVIDER_TYPE_KEY); }
        } catch (err) { console.debug("MetaMask auto-connect check failed:", err); localStorage.removeItem(LAST_PROVIDER_TYPE_KEY); }
      } else if (lastProvider === 'walletconnect') {
        try {
          const restoredData = await restoreWalletConnectSession();
          if (restoredData?.accounts?.length > 0) {
            await setupWeb3AndContract(restoredData.web3, restoredData.accounts[0], Number(restoredData.chainId), 'walletconnect');
            setActiveProviderInstance(restoredData.provider);
          } else { localStorage.removeItem(LAST_PROVIDER_TYPE_KEY); }
        } catch (err) { console.error("Error WalletConnect session restoration:", err); localStorage.removeItem(LAST_PROVIDER_TYPE_KEY); }
      }
      setIsRestoringSession(false);
    };
    if (typeof window !== 'undefined') { attemptAutoConnect(); } else { setIsRestoringSession(false); }
  }, [connectWithMetaMask, setupWeb3AndContract]); // connectWithMetaMask and setupWeb3AndContract are stable

  useEffect(() => {
    if (!activeProviderInstance || !providerType || !account) return () => {};
    console.log(`_app.js: Attaching event listeners for ${providerType}.`);
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) { disconnectWallet(); }
      else if (account && accounts[0].toLowerCase() !== account.toLowerCase()) {
        const { Web3 } = await import('web3');
        const newWeb3Instance = new Web3(activeProviderInstance);
        try {
          const newChainId = await newWeb3Instance.eth.getChainId();
          await setupWeb3AndContract(newWeb3Instance, accounts[0], Number(newChainId), providerType);
        } catch (error) { console.error("Error handling accountsChanged:", error); disconnectWallet(); }
      }
    };
    const handleChainChanged = async (newChainIdHexOrNum) => {
      const newChainId = Number(newChainIdHexOrNum);
      if (web3 && account && activeProviderInstance) {
        const { Web3 } = await import('web3');
        const newWeb3Instance = new Web3(activeProviderInstance);
        await setupWeb3AndContract(newWeb3Instance, account, newChainId, providerType);
      } else { setChainId(newChainId); }
    };
    const handleWCDSessionDisconnect = () => { disconnectWallet(); };

    if (activeProviderInstance.on) {
      activeProviderInstance.on('accountsChanged', handleAccountsChanged);
      activeProviderInstance.on('chainChanged', handleChainChanged);
      if (providerType === 'walletconnect') activeProviderInstance.on('disconnect', handleWCDSessionDisconnect);
    }
    return () => {
      if (activeProviderInstance.removeListener) {
        activeProviderInstance.removeListener('accountsChanged', handleAccountsChanged);
        activeProviderInstance.removeListener('chainChanged', handleChainChanged);
        if (providerType === 'walletconnect') activeProviderInstance.removeListener('disconnect', handleWCDSessionDisconnect);
      } else if (activeProviderInstance.off) { // Fallback
         activeProviderInstance.off('accountsChanged', handleAccountsChanged);
         activeProviderInstance.off('chainChanged', handleChainChanged);
         if (providerType === 'walletconnect') activeProviderInstance.off('disconnect', handleWCDSessionDisconnect);
      }
    };
  }, [activeProviderInstance, providerType, account, web3, setupWeb3AndContract, disconnectWallet]);

  const value = {
    account, web3, contract,
    isConnecting, isRestoringSession,
    chainId, balance,
    connectWithMetaMask, connectWithWalletConnect, disconnectWallet,
    isConnected: !!account, providerType,
    _isDefaultContext: false // This is the actual provider, not the default
  };

  return (
    <Web3Context.Provider value={value}>
      {isRestoringSession && (
         <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffff', fontSize: '1.25rem', textAlign: 'center', padding: '1rem' }}>
           <p className="animate-pulse">RESTORING PREVIOUS GRID CONNECTION<span className="loading-dots"></span></p>
         </div>
      )}
      {children}
    </Web3Context.Provider>
  );
}

// --- MODIFIED App Component for Hydration Fix ---
export default function App({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render nothing or a very basic static placeholder on the server / initial client render
    // to avoid hydration mismatch with components that rely on client-side state/hooks.
    return null;
  }

  // Only render the full DApp once we're on the client
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="ErgoCity - Experience the mathematical beauty of ergodicity in the digital frontier" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ErgoCity - Enter the Grid" />
        <meta property="og:description" content="Experience the mathematical beauty of ergodicity in the digital frontier" />
        <meta property="og:image" content="/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ErgoCity - Enter the Grid" />
        <meta name="twitter:description" content="Experience the mathematical beauty of ergodicity in the digital frontier" />
        <meta name="twitter:image" content="/twitter-image.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      </Head>
      <Web3Provider>
        <Layout> {/* Wrap Component with Layout */}
          <div id="loading-overlay" className="hidden fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
            <div className="text-cyan-400 text-xl animate-pulse">CONNECTING TO THE GRID...</div>
          </div>
          <Component {...pageProps} />
          <div id="notification-container" className="fixed top-4 right-4 z-40 space-y-2"></div>
        </Layout>
        <style jsx global>{`
          ::-webkit-scrollbar { 
            width: 8px; 
            height: 8px; 
          }
          ::-webkit-scrollbar-track { 
            background: #000; 
          }
          ::-webkit-scrollbar-thumb { 
            background: #00ffff; 
            border-radius: 4px; 
            box-shadow: 0 0 10px #00ffff; 
          }
          ::-webkit-scrollbar-thumb:hover { 
            background: #00cccc; 
          }
          ::-webkit-scrollbar-corner { 
            background: #000; 
          }
          html { 
            scroll-behavior: smooth; 
          }
          /* The following 'body' rule is commented out to prevent conflicts 
            with src/styles/globals.css where body styles are now consolidated.
          */
          /* body { background: #000; color: #00ffff; } */

          .loading-dots::after { 
            content: ''; 
            animation: loading-dots 1.5s infinite; 
          }
          @keyframes loading-dots { 
            0%, 20% { content: ''; } 
            40% { content: '.'; } 
            60% { content: '..'; } 
            80%, 100% { content: '...'; } 
          }
          .glow { 
            box-shadow: 0 0 20px #00ffff; 
          }
          .glow-text { 
            text-shadow: 0 0 10px #00ffff; 
          }
          button, .clickable { 
            user-select: none; 
          }
          button:focus, 
          input:focus, 
          textarea:focus, 
          select:focus { 
            outline: 2px solid #00ffff; 
            outline-offset: 2px; 
          }
          ::selection { 
            background: #00ffff; 
            color: #000; 
          }
          ::-moz-selection { 
            background: #00ffff; 
            color: #000; 
          }
        `}</style>
      </Web3Provider>
    </>
  );
}