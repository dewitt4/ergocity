// src/components/ErgoCityInterface.js
import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../pages/_app'; // Adjust if _app.js is elsewhere

const PERCENTAGE_BASE_JS = BigInt(10000);
const DISPLAY_FORMATTING_FACTOR = BigInt(10000); // For 4 decimal places

export default function ErgoCityInterface({ onEnsembleDataUpdate }) {
  const { web3, account, contract, balance } = useWeb3();

  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const [selectedRisk, setSelectedRisk] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [playerScore, setPlayerScore] = useState('0.0000');

  const [lastPlayAmountChanged, setLastPlayAmountChanged] = useState(null);
  const [lastPlayOutcome, setLastPlayOutcome] = useState(null);

  const clearMessages = useCallback(() => {
    setError('');
    setFeedbackMessage('');
    setTransactionHash('');
    setLastPlayAmountChanged(null);
    setLastPlayOutcome(null);
  }, []);

  const fetchPlayerScore = useCallback(async () => {
    if (account && contract && contract.methods && web3) {
      try {
        const scoreFromContract = await contract.methods.getPlayerScore(account).call();
        const scoreBigInt = BigInt(scoreFromContract.toString());
        const valueForDisplay = (scoreBigInt * DISPLAY_FORMATTING_FACTOR) / PERCENTAGE_BASE_JS;
        const formattedScoreString = (Number(valueForDisplay) / Number(DISPLAY_FORMATTING_FACTOR)).toFixed(4);
        setPlayerScore(formattedScoreString);
      } catch (e) {
        console.error("Error fetching player score:", e);
        setPlayerScore('Error');
      }
    }
  }, [account, contract, web3]);

  const fetchEnsembleStats = useCallback(async () => {
    if (contract && contract.methods && onEnsembleDataUpdate) {
      try {
        const rawAvg = await contract.methods.getEnsembleAverageScore().call();
        const rawCount = await contract.methods.registeredPlayerCount().call();
        const avgScoreBigInt = BigInt(rawAvg.toString());
        let formattedAvgScoreString = '0.0000';

        if (BigInt(rawCount.toString()) > 0) {
          const valueForDisplay = (avgScoreBigInt * DISPLAY_FORMATTING_FACTOR) / PERCENTAGE_BASE_JS;
          formattedAvgScoreString = (Number(valueForDisplay) / Number(DISPLAY_FORMATTING_FACTOR)).toFixed(4);
        }
        onEnsembleDataUpdate(formattedAvgScoreString, rawCount.toString());
      } catch (e) {
        console.error("Error fetching ensemble stats:", e);
        onEnsembleDataUpdate('N/A', 'N/A');
      }
    }
  }, [contract, onEnsembleDataUpdate]);

  const runPreFlightChecks = useCallback(async () => {
    if (!web3 || !account || !contract || !contract.methods) {
      console.warn("Pre-Flight Checks: Core dependencies not fully available.");
      // setError("Wallet not connected or DApp not fully initialized."); // Optional: user-facing error
      return false;
    }
    console.log('🚀 === ERGOCITY PRE-FLIGHT DIAGNOSTICS START === 🚀');
    let allChecksPassed = true;
    let tempError = ""; // Accumulate errors for a single setError call

    try {
      // 1. Check Native Token Balance
      const nativeBalanceWei = await web3.eth.getBalance(account);
      const nativeBalanceMatic = web3.utils.fromWei(nativeBalanceWei, 'ether');
      console.log(`✅ Native Balance: ${nativeBalanceMatic} MATIC`);
      if (parseFloat(nativeBalanceMatic) < 0.001) { // Adjust threshold as needed
        tempError += 'Insufficient MATIC for gas. ';
        allChecksPassed = false;
      }

      // 2. Check Network ID
      const networkIdBigInt = await web3.eth.getChainId();
      const networkId = networkIdBigInt.toString();
      // Use environment variable for target chain ID, default to Polygon Mainnet (137)
      const targetNetworkId = process.env.NEXT_PUBLIC_TARGET_CHAIN_ID || '137'; 
      console.log(`✅ Current Network ID: ${networkId} (Target: ${targetNetworkId})`);
      if (!targetNetworkId) {
          tempError += 'Target network ID not configured for DApp. ';
          allChecksPassed = false;
          console.error("CRITICAL: NEXT_PUBLIC_TARGET_CHAIN_ID is not set in .env file.");
      } else if (networkId !== targetNetworkId) {
        tempError += `Incorrect Network. Please switch to target network (ID: ${targetNetworkId}). `;
        allChecksPassed = false;
      }

      // 3. Check if Contract Code Exists at the Address
      const contractAddressFromEnv = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddressFromEnv || contractAddressFromEnv.length !== 42) {
          tempError += 'Contract address missing/invalid in DApp config. ';
          allChecksPassed = false;
      } else {
          const code = await web3.eth.getCode(contractAddressFromEnv);
          const contractExists = code !== '0x' && code !== '0x0' && code.length > 2;
          console.log(`✅ Contract code at ${contractAddressFromEnv}: ${contractExists ? 'FOUND' : 'NOT FOUND'}`);
          if (!contractExists) {
            tempError += `Contract not found at configured address ${contractAddressFromEnv}. `;
            allChecksPassed = false;
          }
      }

      // 4. Check Current Registration Status (only if basic checks passed and contract should exist)
      if (allChecksPassed && contract && contract.methods) { // Ensure contract and methods are available
        const registeredStatus = await contract.methods.playerHasRegistered(account).call();
        console.log(`✅ Player registration status: ${registeredStatus}`);
        setIsRegistered(registeredStatus);
        
        if (registeredStatus) {
            await fetchPlayerScore();
        } else {
            setPlayerScore('0.0000'); 
        }
      } else {
        console.warn("Skipping registration/score check due to failed pre-flight checks or unavailable contract methods.");
      }

    } catch (diagError) {
      console.error('❌ ERROR during pre-flight diagnostics:', diagError);
      tempError += `Diagnostic error: ${diagError.message ? diagError.message.split(/[{|\n]/)[0].trim() : 'Unknown diagnostic issue'}. `;
      allChecksPassed = false;
    }

    if (tempError) {
        setError(tempError.trim());
    } else if (error && !tempError) { // If there was a previous error but current checks are fine
        setError(''); // Clear old error
    }
    console.log(`🚀 === PRE-FLIGHT DIAGNOSTICS ${allChecksPassed ? 'PASSED' : 'FAILED'} === 🚀`);
    return allChecksPassed;
  }, [web3, account, contract, fetchPlayerScore, error]); // 'error' state is a dependency to allow clearing it

  useEffect(() => {
    clearMessages();
    const eventEmittersToClean = [];

    if (account && contract && web3 && contract.methods && contract.events) {
      console.log("ErgoCityInterface UseEffect: Core dependencies ready. Setting up...");
      runPreFlightChecks();
      fetchEnsembleStats();

      const setupEventListener = (eventName, options, dataHandler, errorHandler) => {
        console.log(`Attempting to set up listener for: ${eventName}`);
        if (typeof contract.events[eventName] === 'function') {
          try {
            const eventEmitter = contract.events[eventName](options);
            console.log(`Got emitter for ${eventName}:`, eventEmitter);

            if (eventEmitter && typeof eventEmitter.on === 'function') {
              console.log(`Subscribing to 'data' and 'error' for ${eventName}`);
              eventEmitter.on('data', dataHandler);
              eventEmitter.on('error', errorHandler);
              eventEmittersToClean.push({ name: eventName, instance: eventEmitter });
            } else {
              console.error(`CRITICAL: Emitter for ${eventName} is invalid or has no '.on' method. Emitter:`, eventEmitter);
            }
          } catch (error) {
            console.error(`CRITICAL: Error when trying to instantiate or subscribe to event ${eventName}:`, error);
          }
        } else {
          console.error(`CRITICAL: Event accessor contract.events.${eventName} is not available or not a function.`);
          console.log("Available contract.events keys:", Object.keys(contract.events));
        }
      };

      setupEventListener('EnsembleStatsUpdated', {},
        (event) => { console.log('Event: EnsembleStatsUpdated', event.returnValues); fetchEnsembleStats(); },
        (err) => console.error('EnsembleStatsUpdated event error:', err)
      );
      setupEventListener('PlayMade', { filter: { player: account } },
        (event) => { console.log('Event: PlayMade for me', event.returnValues); fetchPlayerScore(); },
        (err) => console.error('PlayMade event error:', err)
      );
      setupEventListener('PlayerRegistered', { filter: { player: account } },
        (event) => { console.log('Event: PlayerRegistered for me', event.returnValues); fetchPlayerScore(); setIsRegistered(true); },
        (err) => console.error('PlayerRegistered event error:', err)
      );
      setupEventListener('PlayerReset', { filter: { player: account } },
        (event) => { console.log('Event: PlayerReset for me', event.returnValues); fetchPlayerScore(); },
        (err) => console.error('PlayerReset event error:', err)
      );

    } else {
      console.log("ErgoCityInterface UseEffect: Core dependencies (account, contract, web3, contract.events/methods) NOT MET.");
      setIsRegistered(false);
      setPlayerScore('0.0000');
      if (onEnsembleDataUpdate) {
        onEnsembleDataUpdate(null, null);
      }
    }

    return () => {
      console.log("ErgoCityInterface: Cleaning up event listeners.", eventEmittersToClean);
      eventEmittersToClean.forEach(({ name, instance }) => {
        if (instance && typeof instance.removeAllListeners === 'function') {
          console.log(`Removing all listeners for ${name}`);
          instance.removeAllListeners();
        } else {
          console.log(`Could not clean up listeners for ${name}, instance or removeAllListeners not available.`);
        }
      });
    };
  }, [account, contract, web3, runPreFlightChecks, fetchEnsembleStats, fetchPlayerScore, onEnsembleDataUpdate, clearMessages]);


  const handleRegisterPlayer = async () => {
    clearMessages();
    setIsRegistering(true);
    setFeedbackMessage('Performing pre-registration checks...');
    if (!contract || !contract.methods) { setError("Contract not ready for registration."); setIsRegistering(false); return; }
    const checksOk = await runPreFlightChecks();
    if (!checksOk) { setIsRegistering(false); setFeedbackMessage('Pre-registration checks failed. See error message.'); return; } // Use error from checks
    if (isRegistered && parseFloat(playerScore) > 0) { setError("Already registered with a score. Reset if score is 0 to re-initialize."); setIsRegistering(false); setFeedbackMessage(''); return; }
    setFeedbackMessage(isRegistered ? 'Re-initializing score...' : 'Processing registration...');
    try {
      const registerMethod = contract.methods.register();
      const gasEstimate = await registerMethod.estimateGas({ from: account });
      await registerMethod.send({ from: account, gas: gasEstimate.toString() })
        .on('transactionHash', (hash) => { setTransactionHash(hash); setFeedbackMessage('Registration submitted! Awaiting confirmation...'); })
        .on('receipt', async (receipt) => {
          console.log("Registration successful receipt:", receipt);
          setFeedbackMessage('Registration successful!');
          setIsRegistered(true); // Crucial state update
          await fetchPlayerScore(); 
          await fetchEnsembleStats(); // Update ensemble after registration affects player count/total score
          setTransactionHash(''); 
          setTimeout(() => setFeedbackMessage(''), 5000);
        })
        .on('error', (err, receiptOnError) => {
          console.error("Registration .send() error:", err);
          setError(`Registration Failed: ${err.message ? err.message.split(/[{|\n]/)[0].trim() : 'Transaction rejected.'}`);
          setFeedbackMessage(''); 
          if (receiptOnError?.transactionHash) setTransactionHash(receiptOnError.transactionHash);
        });
    } catch (e) {
      console.error("Error during registration call:", e);
      setError(`Registration Error: ${e.message ? e.message.split(/[{|\n]/)[0].trim() : 'Operation failed.'}`);
      setFeedbackMessage('');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResetScore = async () => {
    clearMessages(); setIsLoading(true); setFeedbackMessage('Attempting score reset...');
    if (!contract || !contract.methods) { setError("Contract not ready for reset."); setIsLoading(false); return; }
    const checksOk = await runPreFlightChecks();
    if (!checksOk) { setIsLoading(false); setFeedbackMessage('Pre-reset checks failed. See error message.'); return; }
    if (!isRegistered) { setError("Not registered. Please register first."); setIsLoading(false); setFeedbackMessage(''); return; }
    if (parseFloat(playerScore) > 0) { setError("Score is not zero. Cannot reset."); setIsLoading(false); setFeedbackMessage(''); return; }
    try {
      const resetMethod = contract.methods.resetScoreIfBankrupt();
      const gasEstimate = await resetMethod.estimateGas({ from: account });
      await resetMethod.send({ from: account, gas: gasEstimate.toString() })
        .on('transactionHash', (hash) => { setTransactionHash(hash); setFeedbackMessage('Reset request submitted...'); })
        .on('receipt', async (receipt) => {
          setFeedbackMessage('Score reset successfully!');
          await fetchPlayerScore(); 
          await fetchEnsembleStats(); // Update ensemble after reset affects total score
          setTransactionHash(''); 
          setTimeout(() => setFeedbackMessage(''), 5000);
        })
        .on('error', (err, receiptOnError) => {
          setError(`Reset Failed: ${err.message ? err.message.split(/[{|\n]/)[0].trim() : 'Transaction rejected.'}`);
          setFeedbackMessage(''); 
          if (receiptOnError?.transactionHash) setTransactionHash(receiptOnError.transactionHash);
        });
    } catch (e) {
      setError(`Reset Error: ${e.message ? e.message.split(/[{|\n]/)[0].trim() : 'Operation failed.'}`);
      setFeedbackMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterTheGrid = async () => {
    clearMessages(); setIsLoading(true); setFeedbackMessage('Engaging ErgoDrive...');
    if (!contract || !contract.methods) { setError("Contract not ready to play."); setIsLoading(false); return; }
    const checksOk = await runPreFlightChecks();
    if (!checksOk) { setIsLoading(false); setFeedbackMessage('Pre-engagement checks failed. See error message.'); return; }
    if (!isRegistered) { setError("Identity not confirmed. Register first."); setIsLoading(false); setFeedbackMessage(''); return; }
    if (parseFloat(playerScore) <= 0) { setError("Score is zero. Reset to play."); setIsLoading(false); setFeedbackMessage(''); return; }
    try {
      const contractMethod = contract.methods.play(selectedRisk);
      const gasEstimate = await contractMethod.estimateGas({ from: account });
      await contractMethod.send({ from: account, gas: gasEstimate.toString() })
        .on('transactionHash', (hash) => { setTransactionHash(hash); setFeedbackMessage('ErgoDrive engaged! Awaiting Grid resolution...'); })
        .on('receipt', async (receipt) => {
          console.log("Play Transaction Receipt:", receipt);
          setTransactionHash('');
          let outcomeMsg = "Grid resolution received.";
          if (receipt.events && receipt.events.PlayMade && receipt.events.PlayMade.returnValues) {
            const playEvent = receipt.events.PlayMade.returnValues;
            const newScoreBigInt = BigInt(playEvent.newScore.toString());
            const oldScoreFromEvent = BigInt(playEvent.oldScore.toString());
            const change = newScoreBigInt - oldScoreFromEvent;
            const formattedChange = (Number(change * DISPLAY_FORMATTING_FACTOR / PERCENTAGE_BASE_JS) / Number(DISPLAY_FORMATTING_FACTOR)).toFixed(4);
            setLastPlayAmountChanged(parseFloat(formattedChange));
            setLastPlayOutcome(playEvent.won ? 'win' : 'loss');
            outcomeMsg = playEvent.won ? `Grid Reward: +${formattedChange} units.` : `Grid Cost: ${formattedChange} units.`;
          } else { console.warn("PlayMade event not found or no returnValues in receipt."); }
          setFeedbackMessage(outcomeMsg);
          await fetchPlayerScore(); 
          await fetchEnsembleStats(); // Update ensemble after play affects total score
          setTimeout(() => { setFeedbackMessage(''); setLastPlayAmountChanged(null); setLastPlayOutcome(null); }, 7000);
        })
        .on('error', (err, receiptOnError) => {
          console.error("Play .send() error:", err);
          setError(`ErgoDrive Disengaged: ${err.message ? err.message.split(/[{|\n]/)[0].trim() : 'Transaction rejected.'}`);
          setFeedbackMessage(''); 
          if (receiptOnError?.transactionHash) setTransactionHash(receiptOnError.transactionHash);
        });
    } catch (err) {
      console.error("Error during play call:", err);
      setError(`ErgoDrive Error: ${err.message ? err.message.split(/[{|\n]/)[0].trim() : 'Operation failed.'}`);
      setFeedbackMessage('');
    } finally {
      setIsLoading(false);
    }
  };
  
  const riskProtocols = [
    { name: "LOW", pWin: 55, loss: 30.0, gain: 29.1 }, { name: "MILD", pWin: 60, loss: 42.0, gain: 39.07 },
    { name: "MEDIUM", pWin: 65, loss: 54.0, gain: 47.31 }, { name: "HIGH", pWin: 70, loss: 66.0, gain: 54.31 },
    { name: "EXTREME", pWin: 75, loss: 78.0, gain: 61.29 }, { name: "MAXIMUM", pWin: 80, loss: 90.0, gain: 73.43 },
  ];

  return (
    <div className="w-full max-w-lg p-6 space-y-4 bg-black bg-opacity-70 border border-purple-700 rounded-xl shadow-2xl glow">
      <h2 className="text-3xl font-bold text-center text-purple-400 mb-6 glow-text">Engage ErgoDrive</h2>
      {!account ? (
        <p className="text-center text-yellow-400 py-4">Please connect your wallet to interact.</p>
      ) : (
        <>
          {error && <p className="text-red-500 font-semibold p-3 bg-red-900 bg-opacity-50 rounded-md text-center mb-3">{error}</p>}
          {!isRegistered && (
            <div className="text-center p-4 border border-yellow-600 rounded-md">
              <p className="text-amber-400 mb-3">Confirm your identity with the Grid to engage.</p>
              <button onClick={handleRegisterPlayer} disabled={isRegistering || isLoading} className="w-full px-6 py-3 text-lg font-semibold text-black bg-green-500 rounded-md hover:bg-green-400 disabled:opacity-50">
                {isRegistering ? 'Registering Identity...' : 'Register Identity'}
              </button>
            </div>
          )}
          {isRegistered && parseFloat(playerScore) <= 0 && (
             <div className="text-center p-4 border border-orange-600 rounded-md">
                <p className="text-orange-400 mb-3">Your Grid score is zero. Reset to re-engage.</p>
                <button onClick={handleResetScore} disabled={isLoading || isRegistering} className="w-full px-6 py-3 text-lg font-semibold text-black bg-orange-500 rounded-md hover:bg-orange-400 disabled:opacity-50">
                    {isLoading && feedbackMessage.includes("reset") ? 'Resetting Score...' : 'Reset Score'}
                </button>
            </div>
          )}
          {isRegistered && parseFloat(playerScore) > 0 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="riskSelect" className="block text-sm font-medium text-purple-300 mb-1">Select Risk Protocol:</label>
                <select id="riskSelect" value={selectedRisk} onChange={(e) => setSelectedRisk(Number(e.target.value))} disabled={isLoading || isRegistering} className="w-full p-2.5 bg-gray-900 border border-purple-600 text-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500">
                  {riskProtocols.map((protocol, index) => ( <option key={index} value={index}>{`${index + 1}. ${protocol.name} (P:${protocol.pWin}%, L:${protocol.loss}%, G:${protocol.gain}%)`}</option> ))}
                </select>
              </div>
              <button onClick={handleEnterTheGrid} disabled={isLoading || isRegistering} className="w-full px-6 py-4 text-xl font-bold tracking-wider text-black bg-purple-500 rounded-md hover:bg-purple-400 disabled:opacity-60 glow-text-darker">
                {isLoading && !feedbackMessage.toLowerCase().includes("success") && !feedbackMessage.toLowerCase().includes("processed") ? 'Engaging...' : 'Engage ErgoDrive!'}
              </button>
            </div>
          )}
          <div className="my-4 pt-4 border-t border-purple-800 space-y-2">
            <div className="text-center text-lg">
              <span className="text-purple-400">Your Grid Score: </span><span className="font-semibold text-purple-300 glow-text">{playerScore} units</span>
            </div>
            <div className="text-center text-sm">
              <span className="text-purple-500">Wallet Balance (MATIC): </span><span className="font-semibold text-purple-400">{balance ? parseFloat(balance).toFixed(4) : '0.0000'}</span>
            </div>
          </div>
          {lastPlayOutcome && lastPlayAmountChanged !== null && (
            <div key={`${lastPlayOutcome}-${Date.now()}`} className={`my-3 p-3 text-center text-lg font-semibold rounded-md shadow-md ${lastPlayOutcome === 'win' ? 'bg-green-700 text-green-200 animate-pulse-briefly' : ''} ${lastPlayOutcome === 'loss' ? 'bg-red-700 text-red-200 animate-pulse-briefly' : ''}`}>
              {lastPlayOutcome === 'win' ? 'GRID REWARD: ' : 'GRID COST: '} {lastPlayAmountChanged > 0 ? '+' : ''}{typeof lastPlayAmountChanged === 'number' ? lastPlayAmountChanged.toFixed(4) : String(lastPlayAmountChanged)} units
            </div>
          )}
          <div className="mt-4 text-center text-sm min-h-[60px]"> 
            { (isLoading || isRegistering) && feedbackMessage && !feedbackMessage.toLowerCase().includes("success") && !feedbackMessage.toLowerCase().includes("processed") && !feedbackMessage.toLowerCase().includes("checks failed") && <p className="text-purple-400 animate-pulse">{feedbackMessage}</p> }
            { !(isLoading || isRegistering) && feedbackMessage && !error && <p className="text-purple-300">{feedbackMessage}</p> }
            {transactionHash && (<p className="mt-1"><a href={`https://polygonscan.com/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">View Transaction</a></p>)}
          </div>
        </>
      )}
    </div>
  );
}