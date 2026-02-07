// src/components/WalletButton.js
import { useWeb3 } from '../pages/_app'; // Ensure this path is correct for your project structure

export default function WalletButton() {
  // Call useWeb3 at the top of the component
  const web3ContextData = useWeb3();
  
  // Log what useWeb3() returns
  console.log("WalletButton - Received context:", JSON.stringify(web3ContextData, (key, value) => {
    // Custom replacer to avoid logging huge objects like web3 or contract instances directly
    if (key === 'web3' && value) return "[Web3 Instance]";
    if (key === 'contract' && value) return "[Contract Instance]";
    if (key === 'activeProviderInstance' && value) return "[Provider Instance]";
    if (typeof value === 'function') return "[Function]"; // Don't log full functions
    return value;
  }, 2));

  // Destructure AFTER logging and after useWeb3() has been called
  const {
    account,
    isConnecting,
    isRestoringSession, // Get this from context
    chainId,
    balance,
    connectWithMetaMask,
    connectWithWalletConnect,
    disconnectWallet,
    isConnected,
    providerType,
    _isDefaultContext // Check if we received the default context
  } = web3ContextData;

  if (_isDefaultContext) {
    // This means the real provider value isn't ready or WalletButton is outside the provider
    // You might want to return null or a placeholder until the real context is available
    // or if the useWeb3 hook already returned a default state, this might not be strictly necessary
    // but it's good for understanding the flow.
    console.warn("WalletButton is rendering with DEFAULT context. Real Web3Provider value might not be ready or component is misplaced.");
    // Optionally, return a simpler button or null here to avoid errors if functions are not ready
    // return <button className="px-4 py-2 bg-gray-600 text-gray-400 rounded" disabled>Initializing...</button>;
  }
  
  if (isRestoringSession) { // If still trying to restore a session, show a message
      return (
        <button className="px-4 py-2 bg-gray-700 text-cyan-400 rounded border border-cyan-600 glow-text" disabled>
          Checking Wallet<span className="loading-dots"></span>
        </button>
      );
  }

  if (isConnecting) {
    return (
      <button className="px-4 py-2 bg-gray-700 text-cyan-400 rounded border border-cyan-600 glow-text" disabled>
        Connecting<span className="loading-dots"></span>
      </button>
    );
  }

  if (isConnected && account) {
    return (
      <div className="p-3 border border-cyan-700 rounded-lg shadow-lg bg-black/30 text-sm">
        <p className="text-cyan-400 glow-text truncate" title={account}>
          Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
        </p>
        <p className="text-xs text-cyan-600">
          Provider: <span className="font-semibold">{providerType === 'metamask' ? 'MetaMask' : providerType === 'walletconnect' ? 'WalletConnect' : 'Unknown'}</span>
        </p>
        <p className="text-xs text-cyan-600">Chain ID: {chainId ? Number(chainId) : 'N/A'}</p>
        <p className="text-xs text-cyan-600">Balance: {parseFloat(balance).toFixed(4)} ETH/MATIC</p>
        <button
          onClick={disconnectWallet}
          className="mt-3 w-full px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs border border-red-800 focus:ring-2 focus:ring-red-400 glow"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
      <button
        onClick={connectWithMetaMask}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md border border-orange-700 focus:ring-2 focus:ring-orange-300 glow"
        disabled={isConnecting || isRestoringSession} // Disable if connecting or restoring
      >
        Connect MetaMask
      </button>
      <button
        onClick={connectWithWalletConnect}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md border border-blue-800 focus:ring-2 focus:ring-blue-400 glow"
        disabled={isConnecting || isRestoringSession} // Disable if connecting or restoring
      >
        Connect WalletConnect
      </button>
    </div>
  );
}