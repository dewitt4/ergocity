// src/pages/index.js
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import ErgoCityInterface from '../components/ErgoCityInterface';

export default function Home() {
  const [currentScore, setCurrentScore] = useState(1000.0);
  const [glitchText, setGlitchText] = useState('ERGOCITY');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [ensembleAverageScore, setEnsembleAverageScore] = useState(null);
  const [isLoadingEnsembleAverage, setIsLoadingEnsembleAverage] = useState(true);
  const [ensemblePlayerCount, setEnsemblePlayerCount] = useState(null);

  const gameSettings = [
    { pWin: 55, loss: 30.0, gain: 29.1, risk: 'LOW', color: 'from-green-500 to-cyan-400', icon: '⚡' },
    { pWin: 60, loss: 42.0, gain: 39.07, risk: 'MILD', color: 'from-yellow-500 to-cyan-400', icon: '🔥' },
    { pWin: 65, loss: 54.0, gain: 47.31, risk: 'MEDIUM', color: 'from-orange-500 to-cyan-400', icon: '⚔️' },
    { pWin: 70, loss: 66.0, gain: 54.31, risk: 'HIGH', color: 'from-red-500 to-cyan-400', icon: '💀' },
    { pWin: 75, loss: 78.0, gain: 61.29, risk: 'EXTREME', color: 'from-purple-500 to-red-500', icon: '☠️' },
    { pWin: 80, loss: 90.0, gain: 73.43, risk: 'MAXIMUM', color: 'from-pink-500 to-purple-600', icon: '🌀' },
  ];

  useEffect(() => {
    const glitchChars = 'ȺɃȻĐɆҒǤĦƗɈꝀŁɌNØⱣꝖɌSŦᵾVWX¥ƶ0123456789█▓▒░';
    const originalText = 'ERGOCITY';
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const glitched = originalText.split('').map(char => Math.random() < 0.4 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char).join('');
        setGlitchText(glitched);
        setTimeout(() => setGlitchText(originalText), 120);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const intensity = Math.min(currentScore / 1000, 3);
    setPulseIntensity(intensity);
  }, [currentScore]);

  const handlePlayLocalSimulated = () => {
    setIsPlaying(true);
    const setting = gameSettings[selectedSetting];
    const won = Math.random() * 100 < setting.pWin;
    setTimeout(() => {
      const oldScore = currentScore;
      const newScore = won ? currentScore * (1 + setting.gain / 100) : Math.max(0, currentScore * (1 - setting.loss / 100));
      setCurrentScore(newScore);
      setScoreAnimation(won ? 'score-win' : 'score-lose');
      setGameHistory(prev => [...prev.slice(-9), { result: won ? 'WIN' : 'LOSS', oldScore: oldScore, newScore: newScore, setting: setting.risk, timestamp: Date.now() }]);
      setTimeout(() => setScoreAnimation(''), 1000);
      setIsPlaying(false);
    }, 2500);
  };

  const resetGameLocalSimulated = () => {
    setCurrentScore(1000.0);
    setGameHistory([]);
    setScoreAnimation('score-reset');
    setTimeout(() => setScoreAnimation(''), 500);
  };

  const handleEnsembleDataUpdate = useCallback((avgScore, playerCount) => {
    setEnsembleAverageScore(avgScore);
    setEnsemblePlayerCount(playerCount);
    setIsLoadingEnsembleAverage(false);
  }, []);


  return (
    <>
      <Head>
        <title>ErgoCity - Enter the Grid</title>
        <meta name="description" content="Experience the mathematical beauty of ergodicity in the digital frontier" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent blur-xl animate-pulse"></div>
        <h1
          className="text-9xl font-bold mb-6 neon-text tracking-wider relative z-10 transform hover:scale-105 transition-transform duration-300 text-center" 
          style={{
            filter: `drop-shadow(0 0 ${20 * pulseIntensity}px #00ffff)`,
            animation: scoreAnimation === 'score-win' ? 'bounce 1s ease-in-out' :
                        scoreAnimation === 'score-lose' ? 'shake 1s ease-in-out' :
                        scoreAnimation === 'score-reset' ? 'pulse 0.5s ease-in-out' : 'none'
          }}
        >
          {glitchText}
        </h1>
        <div className="relative">
          <p className="text-xl md:text-3xl text-cyan-300 mb-6 glitch-subtitle font-mono">
            ERGODIC ENABLED
          </p>
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(7)].map((_, i) => (<div key={i} className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />))}
          </div>
        </div>
        <div className="w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-4"></div>
        <div className="text-xs text-cyan-600 font-mono tracking-widest">PROTOCOL VERSION 2.1.0</div>
      </header>

      <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="relative group w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 blur-xl animate-pulse"></div>
          <div className="relative p-8 border-2 border-cyan-400 bg-black bg-opacity-70 backdrop-blur-lg neon-border transform hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-cyan-400"></div>
                <h2 className="text-sm text-cyan-300 tracking-widest font-mono">CURRENT (SIMULATED) BALANCE</h2>
                <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-cyan-400"></div>
              </div>
              <div className={`text-5xl md:text-7xl font-mono text-cyan-400 neon-text mb-2 ${scoreAnimation}`} style={{ filter: `drop-shadow(0 0 ${15 * pulseIntensity}px #00ffff)` }}>
                {currentScore.toFixed(2)}
              </div>
              <div className="text-xs text-cyan-600 font-mono">UNITS • EPHEMERAL • LOCAL SIMULATION</div>
            </div>
            {gameHistory.length > 0 && (
              <button onClick={() => setShowStats(!showStats)} className="mt-4 text-xs text-cyan-500 hover:text-cyan-300 transition-colors underline self-center">
                {showStats ? 'HIDE' : 'SHOW'} (SIMULATED) LOG
              </button>
            )}
          </div>
        </div>

        <div className="relative group w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 blur-xl animate-pulse"></div>
          <div className="relative p-8 border-2 border-purple-400 bg-black bg-opacity-70 backdrop-blur-lg neon-border transform hover:scale-105 transition-all duration-300 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-purple-400"></div>
                <h2 className="text-sm text-purple-300 tracking-widest font-mono">ENSEMBLE AVERAGE (GRID)</h2>
                <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-purple-400"></div>
              </div>
              {isLoadingEnsembleAverage ? (
                <div className="text-5xl md:text-7xl font-mono text-purple-400 neon-text mb-2 animate-pulse">
                  LOADING...
                </div>
              ) : (
                <div className={`text-5xl md:text-7xl font-mono text-purple-400 neon-text mb-2`}>
                  {ensembleAverageScore !== null && ensembleAverageScore !== 'N/A' ? ensembleAverageScore : '--.--'}
                </div>
              )}
              {ensemblePlayerCount !== null && ensemblePlayerCount !== 'N/A' && !isLoadingEnsembleAverage && (
                <div className="text-xs text-purple-500 font-mono">
                  FROM {ensemblePlayerCount} REGISTERED PLAYERS
                </div>
              )}
              <div className="text-xs text-purple-600 font-mono mt-1">UNITS • AGGREGATED • ON-CHAIN</div>
            </div>
            <div className="mt-4 text-xs text-purple-700 self-center">Blockchain Data</div>
          </div>
        </div>
      </div>

      {showStats && gameHistory.length > 0 && (
        <div className="mb-12 p-6 border border-cyan-600 bg-black bg-opacity-50 backdrop-blur-sm text-left">
          <h3 className="text-lg font-bold mb-4 text-cyan-400 tracking-wider text-center">(SIMULATED) RECENT TRANSACTIONS</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
            {gameHistory.slice(-10).map((game, index) => (
              <div key={index} className={`p-2 border ${game.result === 'WIN' ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'} bg-black bg-opacity-30`}>
                <div>{game.result}</div>
                <div className="text-cyan-300">{game.setting}</div>
                <div>{game.newScore.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="my-16 w-full flex flex-col items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-8 opacity-50"></div>
        <h3 className="text-4xl font-bold text-center text-purple-400 mb-8 glow-text tracking-wider filter drop-shadow(0 0 10px #8A2BE2)">
          ≫ ENTER GRID ENGAGEMENT (BLOCKCHAIN) ≪
        </h3>
        <ErgoCityInterface onEnsembleDataUpdate={handleEnsembleDataUpdate} />
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-8 opacity-50"></div>
      </section>
      
      <div className="mb-16">
        <div className="mb-12">
          <h3 className="text-3xl mb-4 text-cyan-300 tracking-widest font-mono">
            ≫ SELECT SIMULATED RISK PROTOCOL ≪
          </h3>
          <div className="text-sm text-cyan-600 mb-8 font-mono">
            CHOOSE YOUR PROBABILITY MATRIX (LOCAL SIMULATION)
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {gameSettings.map((setting, index) => (
            <div
              key={index}
              onClick={() => setSelectedSetting(index)}
              className={`group relative p-8 border-2 cursor-pointer transition-all duration-500 hover:scale-110 transform max-w-sm justify-self-center ${selectedSetting === index ? 'border-cyan-400 bg-cyan-900 bg-opacity-30 neon-border-selected scale-105' : 'border-cyan-600 bg-black bg-opacity-40 hover:border-cyan-400 hover:bg-opacity-60'}`}
              style={{background: selectedSetting === index ? `linear-gradient(135deg, rgba(0,255,255,0.1), rgba(0,100,200,0.1))` : undefined }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${setting.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="text-4xl mb-4 filter drop-shadow-lg">{setting.icon}</div>
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-cyan-400 mb-4 tracking-wider font-mono">{setting.risk}</h4>
                <div className="space-y-3 text-sm"> 
                  <div className="flex justify-start items-center p-2 bg-black bg-opacity-30 rounded gap-x-4">
                    <span className="text-cyan-300 text-left">Success Rate:</span>
                    <span className="text-green-400 font-mono font-bold text-right flex-grow">{setting.pWin}%</span>
                  </div>
                  <div className="flex justify-start items-center p-2 bg-black bg-opacity-30 rounded gap-x-4">
                    <span className="text-cyan-300 text-left">Loss Penalty:</span>
                    <span className="text-red-400 font-mono font-bold text-right flex-grow">-{setting.loss}%</span>
                  </div>
                  <div className="flex justify-start items-center p-2 bg-black bg-opacity-30 rounded gap-x-4">
                    <span className="text-cyan-300 text-left">Win Bonus:</span>
                    <span className="text-green-400 font-mono font-bold text-right flex-grow">+{setting.gain}%</span>
                  </div>
                </div>
                {selectedSetting === index && (<div className="mt-4 text-xs text-cyan-400 font-mono animate-pulse">≫ SIMULATED PROTOCOL SELECTED ≪</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-16 space-y-6 text-center">
        <div className="relative inline-block">
          <button
            onClick={handlePlayLocalSimulated}
            disabled={isPlaying}
            className="group relative px-16 py-6 text-2xl font-bold tracking-widest border-2 border-cyan-400 bg-black bg-opacity-60 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-500 neon-border disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 font-mono">
              {isPlaying ? (<><span className="animate-pulse">SIMULATING</span><span className="loading-dots">...</span></>) : ('≫ ENTER SIMULATED GRID ≪')}
            </span>
          </button>
        </div>
        <div>
          <button
              onClick={resetGameLocalSimulated}
              className="px-8 py-3 text-sm font-mono tracking-widest border border-cyan-600 text-cyan-600 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300 bg-black bg-opacity-30"
          >
              RESET SIMULATED PROTOCOL
          </button>
        </div>
      </div>

      {/* Info Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="group relative p-8 border border-cyan-600 bg-black bg-opacity-40 backdrop-blur-lg hover:bg-opacity-60 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6 text-left">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mr-4 animate-pulse shrink-0"></div>
              <h3 className="text-2xl font-bold text-cyan-400 tracking-wider font-mono">THE ERGODIC PARADOX</h3>
            </div>
            {/* MODIFIED TEXT BLOCK BELOW */}
            <div className="text-cyan-300 leading-relaxed text-lg text-left space-y-3"> 
              <p>
                Explore a core principle of ergodicity: in systems driven by multiplicative effects, like this simulation, there's often a divergence. The average outcome experienced by a large group of players (ensemble average) can differ significantly from the typical journey of a single player persisting through many rounds (time average). Witness how these distinct statistical perspectives emerge.
              </p>
              <div>
                <p className="mb-1">
                  For example, consider the 'LOW' risk protocol. It has a 55% Success Rate. If your current score is 1,000 units:
                </p>
                <div className="pl-4"> 
                  <div className="mb-2"> 
                    <p className="mb-0 text-base"> 
                      A win (with its +29.1% Win Bonus) changes your score to:
                    </p>
                    <code className="block text-sm text-cyan-200">
                      1000 * (1 + 29.1/100) = 1000 * 1.291 = 1291 units.
                    </code>
                  </div>
                  <div> 
                    <p className="mb-0 text-base">
                      A loss (with its -30.0% Loss Penalty) changes your score to:
                    </p>
                    <code className="block text-sm text-cyan-200">
                      1000 * (1 - 30.0/100) = 1000 * 0.70 = 700 units.
                    </code>
                  </div>
                </div>
              </div>
              <p>
                Each round applies such a multiplicative change based on the outcome.
              </p>
            </div>
            {/* END OF MODIFIED TEXT BLOCK */}
            <div className="mt-4 text-xs text-cyan-600 font-mono text-left">
                MATHEMATICAL PRINCIPLE • NON-ERGODIC SYSTEM • MULTIPLICATIVE DYNAMICS
            </div>
          </div>
        </div>
        <div className="group relative p-8 border border-cyan-600 bg-black bg-opacity-40 backdrop-blur-lg hover:bg-opacity-60 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6 text-left">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-4 animate-pulse shrink-0"></div>
              <h3 className="text-2xl font-bold text-cyan-400 tracking-wider font-mono">QUANTUM PROTOCOL</h3>
            </div>
            <p className="text-cyan-300 leading-relaxed text-lg text-left">
              Powered by advanced <span className="text-cyan-400 font-mono">quantum randomness</span> algorithms with cryptographically secure pseudo-random number generation. Each outcome is mathematically fair and verifiably random through blockchain verification.
            </p>
            <div className="mt-4 text-xs text-cyan-600 font-mono text-left">QUANTUM SECURED • BLOCKCHAIN VERIFIED • CRYPTOGRAPHICALLY FAIR</div>
          </div>
        </div>
      </div>

      <footer className="text-cyan-600 text-sm font-mono">
        <div className="mb-6"><div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-600 to-transparent mb-4"></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"><div>MATHEMATICAL EXPLORATION</div><div>EDUCATIONAL PURPOSE</div><div>ENTER AT YOUR OWN RISK</div></div></div>
        <div className="text-xs opacity-60">© {new Date().getFullYear()} ERGOCITY PROTOCOL • VERSION 2.1.0 • QUANTUM ENHANCED</div>
      </footer>

      <style jsx>{`
        .score-win { animation: scoreWin 1s ease-out; }
        .score-lose { animation: scoreLose 1s ease-out; }
        .score-reset { animation: scoreReset 0.5s ease-out; }
        @keyframes scoreWin { 0% { transform: scale(1); } 50% { transform: scale(1.2); color: #10b981; } 100% { transform: scale(1); } }
        @keyframes scoreLose { 0% { transform: translateX(0); } 25% { transform: translateX(-10px); color: #ef4444; } 75% { transform: translateX(10px); color: #ef4444; } 100% { transform: translateX(0); } }
        @keyframes scoreReset { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .loading-dots::after {
            content: ' .';
            animation: dots 1s steps(5, end) infinite;
        }
        @keyframes dots {
            0%, 20% { color: rgba(0,0,0,0); text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
            40% { color: white; text-shadow: .25em 0 0 rgba(0,0,0,0), .5em 0 0 rgba(0,0,0,0); }
            60% { text-shadow: .25em 0 0 white, .5em 0 0 rgba(0,0,0,0); }
            80%, 100% { text-shadow: .25em 0 0 white, .5em 0 0 white; }
        }
        .animate-pulse-briefly {
            animation: pulse-briefly 1.5s ease-out;
        }
        @keyframes pulse-briefly {
            0% { opacity: 0.5; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}