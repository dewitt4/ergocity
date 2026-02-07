// src/components/Layout.js
import Head from 'next/head';
import { useWeb3 } from '@/pages/_app'; // Or your specific path to useWeb3 hook

export default function Layout({ children }) {
  const {
    account,
    connectWithMetaMask,
    connectWithWalletConnect,
    disconnectWallet,
    isConnecting,
    providerType
  } = useWeb3();

  return (
    <>
      <Head>
        <title>ERGOCITY</title> {/* This can be a default title, pages can override */}
        <meta name="description" content="Ergodicity-based DApp Simulation" />
        {/* Add other global meta tags or link tags here if needed */}
      </Head>

      <div className="grid-background relative text-cyan-400 font-sans min-h-screen">
        {/* Sidebar Panel */}
        <aside className="fixed top-0 left-0 h-full w-60 p-4 bg-black bg-opacity-80 border-r border-cyan-400 shadow-neon z-50 flex flex-col">
          {/* Top part of the sidebar (menu) */}
          <div className="flex-grow">
            <h2 className="text-xl font-bold neon-text mb-4">MENU</h2>
            <ul className="space-y-4">
              <li><a href="#play" className="block p-2 hover:text-cyan-300 hover:bg-cyan-700/30 rounded">Play</a></li>
              <li><a href="#stats" className="block p-2 hover:text-cyan-300 hover:bg-cyan-700/30 rounded">Stats</a></li>
              <li><a href="#graph" className="block p-2 hover:text-cyan-300 hover:bg-cyan-700/30 rounded">Graph</a></li>
              {/* Add more navigation links here if needed */}
            </ul>
          </div>

          {/* Wallet Connection Section (bottom of the sidebar) */}
          <div className="mt-auto pt-4 border-t border-cyan-600">
            {isConnecting ? (
              <div className="p-2 text-sm text-yellow-400 animate-pulse text-center">
                Connecting...
              </div>
            ) : !account ? (
              <div className="space-y-3">
                <button
                  onClick={connectWithMetaMask}
                  className="w-full p-2 text-sm bg-cyan-700 hover:bg-cyan-600 text-white rounded shadow-md hover:shadow-lg transition-all neon-border"
                  aria-label="Connect with MetaMask"
                >
                  Connect MetaMask
                </button>
                <button
                  onClick={connectWithWalletConnect}
                  className="w-full p-2 text-sm bg-purple-700 hover:bg-purple-600 text-white rounded shadow-md hover:shadow-lg transition-all neon-border"
                  aria-label="Connect with WalletConnect"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="text-sm text-center">
                <p className="mb-1 text-green-400">Connected!</p>
                <p className="text-xs text-gray-400 mb-1">
                  {providerType === 'metamask' ? 'MetaMask' : providerType === 'walletconnect' ? 'WalletConnect' : 'Wallet'}
                </p>
                <p
                  className="truncate text-xs text-cyan-300 mb-2 w-full px-1"
                  title={account} // Show full account on hover
                >
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </p>
                <button
                  onClick={disconnectWallet}
                  className="w-full p-2 text-xs bg-red-700 hover:bg-red-600 text-white rounded shadow-md hover:shadow-lg transition-all neon-border"
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        {/* The pl-60 class on this div ensures it doesn't overlap with the fixed sidebar */}
        <div className="min-h-screen flex flex-col items-center justify-start pl-60 p-6">
          {/*
            The main "ERGOCITY" h1 title that was previously here has been removed.
            Individual pages (like Home.js) will now be responsible for their primary headings.
          */}
          {/* <h1 className="text-7xl font-extrabold neon-text mt-4 mb-6 drop-shadow-lg">ERGOCITY</h1> REMOVED */}

          {/* The children prop (actual page content like Home.js) is rendered here */}
          <main className="w-full max-w-6xl pt-8"> {/* Added some padding-top (pt-8) to give space if pages don't have their own immediate heading */}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}