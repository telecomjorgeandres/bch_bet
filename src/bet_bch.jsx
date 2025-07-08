import React, { useState, useEffect } from 'react';
import { CircleDot, DollarSign, Copy, CheckCircle, AlertCircle, Clock, Calendar, Users, Zap, Send, QrCode } from 'lucide-react';

const BCHBettingApp = () => {
  // State to hold the list of matches
  const [matches, setMatches] = useState([]);
  // State to hold the currently selected match for viewing outcomes
  const [selectedMatch, setSelectedMatch] = useState(null);
  // State to hold the currently selected score outcome for betting
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  // State for BCH to USD rate (initially a placeholder, will be fetched)
  const [bchUsdRate, setBchUsdRate] = useState(0);
  // State for the fixed ticket value in USD
  const ticketValueUsd = 1.00;
  // State for copy-to-clipboard feedback
  const [copySuccess, setCopySuccess] = useState('');

  // States for the Simulate Bet form
  const [simulateBetMatchId, setSimulateBetMatchId] = useState('');
  const [simulateBetOutcomeId, setSimulateBetOutcomeId] = useState('');
  const [simulateBetMessage, setSimulateBetMessage] = useState('');

  // Effect to fetch match data and BCH rate from your Django backend API
  // This useEffect will now also handle dynamic price updates
  useEffect(() => {
    const fetchBCHData = async () => {
      try {
        // Fetch matches from Django API
        const matchesResponse = await fetch('http://localhost:8000/api/matches/');
        const matchesData = await matchesResponse.json();
        // --- FIX HERE ---
        setMatches(matchesData.matches); // <--- Access the 'matches' array from the object
        console.log("Fetched Matches:", matchesData.matches); // Log the array itself
        // --- END FIX ---

        // Fetch BCH rate from Django API
        const rateResponse = await fetch('http://localhost:8000/api/bch-rate/');
        const rateData = await rateResponse.json();
        setBchUsdRate(parseFloat(rateData.bch_usd_rate));
        console.log("Fetched BCH USD Rate:", parseFloat(rateData.bch_usd_rate));

      } catch (error) {
        console.error('Error fetching data from backend:', error);
        // Optionally, set an error state or display a message if fetching fails
      }
    };

    // Initial fetch when the component mounts
    fetchBCHData();

    // Set up interval to fetch BCH data every 60 seconds (60000 milliseconds)
    const intervalId = setInterval(fetchBCHData, 60000); // Changed from 30000 to 60000

    // Cleanup function: This runs when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this effect runs once on mount and cleans up on unmount

  // Calculate required BCH for one ticket (only if bchUsdRate is not 0 to avoid division by zero)
  const requiredBCH = bchUsdRate > 0 ? (ticketValueUsd / bchUsdRate).toFixed(8) : 'Loading...';
  console.log("Required BCH per ticket:", requiredBCH);

  // Log selectedOutcome whenever it changes
  useEffect(() => {
    console.log("selectedOutcome state updated to:", selectedOutcome);
  }, [selectedOutcome]);

  // Function to copy text to clipboard (generalized)
  const copyToClipboard = (text, successMessage = 'Copied!') => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(successMessage);
      setTimeout(() => setCopySuccess(''), 2000); // Clear message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy!');
      setTimeout(() => setCopySuccess(''), 2000);
    }
    document.body.removeChild(textarea);
  };

  // Handler for simulating a bet
  const handleSimulateBet = async (e) => {
    e.preventDefault();
    setSimulateBetMessage('Sending simulated bet...');

    try {
      const response = await fetch('http://localhost:8000/api/simulate-bet/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: simulateBetMatchId,
          score_outcome_id: simulateBetOutcomeId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSimulateBetMessage(`Success: ${data.message} (Tickets: ${data.num_tickets})`);
        // Optionally, re-fetch matches to update counts in the UI
        const matchesResponse = await fetch('http://localhost:8000/api/matches/');
        const matchesData = await matchesResponse.json();
        // --- FIX HERE ---
        setMatches(matchesData.matches); // <--- Also fix here after simulating a bet
        // --- END FIX ---
      } else {
        setSimulateBetMessage(`Error: ${data.error || 'Something went wrong.'}`);
      }
    } catch (error) {
      console.error('Error simulating bet:', error);
      setSimulateBetMessage('Network error or server unreachable.');
    } finally {
      setTimeout(() => setSimulateBetMessage(''), 5000); // Clear message after 5 seconds
    }
  };

  // Construct the Bitcoin Cash payment URI for the QR code and copy function
  const bchPaymentUri = selectedOutcome?.bch_address && parseFloat(requiredBCH) > 0
    ? `${selectedOutcome.bch_address}?amount=${requiredBCH}`
    : '';

  console.log("Current selectedOutcome for QR:", selectedOutcome);
  console.log("bchPaymentUri:", bchPaymentUri);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-inter antialiased">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <header className="bg-blue-700 text-white p-6 sm:p-8 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <CircleDot size={36} className="text-blue-200" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Club Cup BCH Bets</h1>
          </div>
          <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full text-sm font-medium">
            <DollarSign size={18} />
            <span>1 BCH = ${bchUsdRate === 0 ? 'Loading...' : bchUsdRate.toFixed(2)} USD</span>
          </div>
        </header>

        <main className="p-6 sm:p-8">
          {/* Match List Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar size={24} className="mr-2 text-blue-500" /> Upcoming Matches
            </h2>
            <div className="space-y-4">
              {matches.length > 0 ? (
                matches.map(match => (
                  <div
                    key={match.match_id}
                    className={`bg-gray-50 border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 ease-in-out
                                ${selectedMatch?.match_id === match.match_id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-lg hover:border-blue-500'}`}
                    onClick={() => {
                      setSelectedMatch(match);
                      setSelectedOutcome(null); // Reset outcome selection
                      console.log("Selected Match:", match);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="lg:text-lg font-bold text-gray-900">
                        {match.team1} <span className="text-red-500 mx-1">vs</span> {match.team2}
                      </h3>
                      <span className="text-sm text-gray-600 flex items-center">
                        <Clock size={16} className="mr-1 text-gray-400" /> {match.match_date}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {Object.keys(match.betting_outcomes).length} possible scores
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No matches available at the moment. Check back soon!</p>
              )}
            </div>
          </section>

          {/* Betting Outcomes Section (Conditional Rendering) */}
          {selectedMatch && (
            <section className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center">
                <Users size={24} className="mr-2 text-blue-600" /> Bet on {selectedMatch.team1} vs {selectedMatch.team2}
              </h2>
              <p className="text-gray-700 mb-4 text-sm">
                Ticket Value: <span className="font-bold text-blue-700">${ticketValueUsd.toFixed(2)} USD</span> (approx. <span className="font-bold text-blue-700">{requiredBCH} BCH</span>)
              </p>

              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
                {Object.entries(selectedMatch.betting_outcomes).map(([outcomeId, outcome]) => (
                  <button
                    key={outcomeId}
                    className={`p-3 rounded-lg border transition-all duration-200 ease-in-out
                                ${selectedOutcome?.score === outcome.score
                                  ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-700'
                                  : 'bg-white text-gray-800 hover:bg-blue-100 hover:border-blue-500'}`}
                    onClick={() => {
                      setSelectedOutcome(outcome);
                      console.log("Selected Outcome (from onClick):", outcome);
                    }}
                  >
                    <span className="font-bold text-lg">{outcome.score}</span>
                    <p className={`text-xs ${selectedOutcome?.score === outcome.score ? 'text-blue-200' : 'text-gray-500'}`}>
                      {outcome.bet_count} tickets
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Selected Outcome Details (Conditional Rendering) */}
          {selectedOutcome && (
            <section className="p-6 bg-green-50 rounded-xl border border-green-200 shadow-md">
              <h2 className="text-2xl font-semibold text-green-800 mb-4 flex items-center">
                <Zap size={24} className="mr-2 text-green-600" /> Place Your Bet
              </h2> 
              <p className="text-gray-700 mb-4">
                To bet on score <span className="font-bold text-green-700 text-xl">{selectedOutcome.score}</span>, send your BCH to the address below.
                Each ticket costs exactly <span className="font-bold text-green-700 text-xl">{requiredBCH} BCH</span> (for ${ticketValueUsd.toFixed(2)} USD).
                You can send multiple tickets by sending multiples of this amount (e.g., { (parseFloat(requiredBCH) * 2).toFixed(8) } BCH for 2 tickets).
              </p>

              {/* QR Code and Address Section */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-4 sm:space-y-0 sm:space-x-6 mb-4">
                {selectedOutcome.bch_address && parseFloat(requiredBCH) > 0 && (
                  <div className="flex flex-col items-center">
                    <QrCode size={36} className="text-green-600 mb-2" />
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bchPaymentUri)}`}
                      alt="BCH QR Code"
                      className="rounded-lg border border-gray-200 p-1"
                    />
                    <p className="text-sm text-gray-600 mt-2">Scan to pay</p>
                  </div>
                )}

                <div className="flex-grow flex flex-col items-center sm:items-start space-y-3">
                  <div className="bg-white border border-green-300 rounded-lg p-4 flex flex-col items-center sm:items-start space-y-2 w-full">
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-medium text-gray-600">BCH Address:</p>
                      <p className="break-all text-sm sm:text-base font-mono text-gray-900 font-bold">
                        {selectedOutcome.bch_address}
                      </p>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-medium text-gray-600">Amount per Ticket ($1 USD):</p>
                      <p className="text-lg sm:text-xl font-bold text-green-700">
                        {requiredBCH} BCH
                      </p>
                    </div>
                  </div>

                  {/* Combined Copy Button */}
                  <button
                    onClick={() => copyToClipboard(bchPaymentUri, 'Payment URI copied!')}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={!bchPaymentUri || requiredBCH === 'Loading...'}
                  >
                    <Copy size={18} />
                    <span>{copySuccess || 'Copy BCH Payment URI'}</span>
                  </button>

                  {copySuccess === 'Payment URI copied!' && (
                    <p className="mt-2 text-center sm:text-left text-green-600 text-sm flex items-center justify-center sm:justify-start">
                      <CheckCircle size={16} className="mr-1" /> Full payment URI copied to clipboard!
                    </p>
                  )}
                  {copySuccess === 'Failed to copy!' && (
                    <p className="mt-2 text-center sm:text-left text-red-600 text-sm flex items-center justify-center sm:justify-start">
                      <AlertCircle size={16} className="mr-1" /> Failed to copy. Please copy manually.
                    </p>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-xs mt-4 text-center sm:text-left">
                * Ensure you send the exact amount per ticket. Payments from non-originating addresses or with incorrect amounts may not be counted.
              </p>
            </section>
          )}

          {/* Simulate Bet Section (Updated) */}
          <section className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4 flex items-center">
              <Send size={24} className="mr-2 text-yellow-600" /> Simulate a Bet (for Testing)
            </h2>
            <p className="text-gray-700 mb-4">
              Use this form to simulate a user sending BCH to a betting outcome address.
              The origin address and the BCH amount will be randomly generated by the backend.
            </p>
            <form onSubmit={handleSimulateBet} className="space-y-4">
              <div>
                <label htmlFor="simulateMatchId" className="block text-sm font-medium text-gray-700">Match ID:</label>
                <select
                  id="simulateMatchId"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={simulateBetMatchId}
                  onChange={(e) => {
                    setSimulateBetMatchId(e.target.value);
                    setSimulateBetOutcomeId(''); // Reset outcome when match changes
                  }}
                  required
                >
                  <option value="">Select a Match</option>
                  {matches.map(match => (
                    <option key={match.match_id} value={match.match_id}>
                      {match.team1} vs {match.team2} ({match.match_date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="simulateOutcomeId" className="block text-sm font-medium text-gray-700">Score Outcome:</label>
                <select
                  id="simulateOutcomeId"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={simulateBetOutcomeId}
                  onChange={(e) => setSimulateBetOutcomeId(e.target.value)}
                  required
                  disabled={!simulateBetMatchId}
                >
                  <option value="">Select an Outcome</option>
                  {simulateBetMatchId && matches.find(m => m.match_id === simulateBetMatchId)?.betting_outcomes &&
                    Object.entries(matches.find(m => m.match_id === simulateBetMatchId).betting_outcomes).map(([outcomeId, outcome]) => (
                      <option key={outcomeId} value={outcomeId}>
                        {outcome.score}
                      </option>
                    ))
                  }
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <Send size={18} />
                <span>Simulate Bet</span>
              </button>
              {simulateBetMessage && (
                <p className="mt-2 text-center text-sm font-medium">
                  {simulateBetMessage.startsWith('Success') ? (
                    <span className="text-green-600 flex items-center justify-center"><CheckCircle size={16} className="mr-1" /> {simulateBetMessage}</span>
                  ) : (
                    <span className="text-red-700 flex items-center justify-center"><AlertCircle size={16} className="mr-1" /> {simulateBetMessage}</span>
                  )}
                </p>
              )}
            </form>
          </section>
        </main>

        <footer className="bg-gray-800 text-gray-300 p-4 sm:p-6 text-center text-sm rounded-b-2xl">
          <p>&copy; 2025 Club Cup BCH. Powered by Bitcoin Cash.</p>
        </footer>
      </div>
    </div>
  );
};

export default BCHBettingApp;