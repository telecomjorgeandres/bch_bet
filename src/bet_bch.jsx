import React, { useState, useEffect } from 'react';
import { CircleDot, DollarSign, Copy, CheckCircle, AlertCircle, Clock, Calendar, Users, Zap, Send, QrCode, XCircle } from 'lucide-react'; // Added XCircle for clearing bet

const BCHBettingApp = () => {
  // State to hold the list of matches
  const [matches, setMatches] = useState([]);
  // State to hold the currently selected match for viewing outcomes
  // Initialize from localStorage or null
  const [selectedMatch, setSelectedMatch] = useState(() => {
    try {
      const storedMatch = localStorage.getItem('selectedMatch');
      return storedMatch ? JSON.parse(storedMatch) : null;
    } catch (error) {
      console.error("Failed to parse selectedMatch from localStorage", error);
      return null;
    }
  });
  // State to hold the currently selected score outcome for betting
  // Initialize from localStorage or null
  const [selectedOutcome, setSelectedOutcome] = useState(() => {
    try {
      const storedOutcome = localStorage.getItem('selectedOutcome');
      return storedOutcome ? JSON.parse(storedOutcome) : null;
    } catch (error) {
      console.error("Failed to parse selectedOutcome from localStorage", error);
      return null;
    }
  });
  // State for BCH to USD rate (initially a placeholder, will be fetched)
  const [bchUsdRate, setBchUsdRate] = useState(0);
  // State for the fixed ticket value in USD
  const ticketValueUsd = 1.00;
  // State for copy-to-clipboard feedback
  const [copySuccess, setCopySuccess] = useState('');

  // States for the Simulate Prediction form
  const [simulatePredictionMatchId, setSimulatePredictionMatchId] = useState('');
  const [simulatePredictionOutcomeId, setSimulatePredictionOutcomeId] = useState('');
  const [simulatePredictionMessage, setSimulatePredictionMessage] = useState('');

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Effect to fetch match data and BCH rate from your Django backend API
  // This useEffect will now also handle dynamic price updates
  useEffect(() => {
    const fetchBCHData = async () => {
      try {
        // Fetch matches from Django API
        const matchesResponse = await fetch('http://localhost:8000/api/matches/');
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches);
        console.log("Fetched Matches:", matchesData.matches);

        // Fetch BCH rate from Django API
        const rateResponse = await fetch('http://localhost:8000/api/bch-rate/');
        const rateData = await rateResponse.json();
        // Ensure you're accessing the correct field from the BCHRateSerializer
        setBchUsdRate(parseFloat(rateData.rate)); // <-- CORRECTED: Accessing 'rate' field
        console.log("Fetched BCH USD Rate:", parseFloat(rateData.rate)); // <-- CORRECTED LOG

      } catch (error) {
        console.error('Error fetching data from backend:', error);
        // Optionally, set an error state or display a message if fetching fails
      }
    };

    // Initial fetch when the component mounts
    fetchBCHData();

    // Set up interval to fetch BCH data every 60 seconds (60000 milliseconds)
    const intervalId = setInterval(fetchBCHData, 60000);

    // Cleanup function: This runs when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures this effect runs once on mount and cleans up on unmount

  // Effect to persist selectedMatch to localStorage whenever it changes
  useEffect(() => {
    if (selectedMatch) {
      localStorage.setItem('selectedMatch', JSON.stringify(selectedMatch));
      // console.log("selectedMatch persisted:", selectedMatch); // Commented out for cleaner console
    } else {
      localStorage.removeItem('selectedMatch');
      // console.log("selectedMatch cleared from persistence."); // Commented out for cleaner console
    }
  }, [selectedMatch]);

  // Effect to persist selectedOutcome to localStorage whenever it changes
  useEffect(() => {
    if (selectedOutcome) {
      localStorage.setItem('selectedOutcome', JSON.stringify(selectedOutcome));
      // console.log("selectedOutcome persisted:", selectedOutcome); // Commented out for cleaner console
    } else {
      localStorage.removeItem('selectedOutcome');
      // console.log("selectedOutcome cleared from persistence."); // Commented out for cleaner console
    }
  }, [selectedOutcome]);

  // Calculate required BCH for one ticket (only if bchUsdRate is not 0 to avoid division by zero)
  const requiredBCH = bchUsdRate > 0 ? (ticketValueUsd / bchUsdRate).toFixed(8) : 'Loading...';
  // console.log("Required BCH per ticket:", requiredBCH); // Commented out for cleaner console

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

  // Handler for simulating a prediction
  const handleSimulatePrediction = async (e) => {
    e.preventDefault();
    setSimulatePredictionMessage('Sending simulated prediction...');

    try {
      const response = await fetch('http://localhost:8000/api/simulate-prediction/', { // Corrected endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: simulatePredictionMatchId,
          score_outcome_id: simulatePredictionOutcomeId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSimulatePredictionMessage(`Success: ${data.message} (Entries: ${data.num_tickets})`); // Changed "Tickets" to "Entries"
        // Optionally, re-fetch matches to update counts in the UI
        const matchesResponse = await fetch('http://localhost:8000/api/matches/');
        const matchesData = await matchesResponse.json();
        setMatches(matchesData.matches);
      } else {
        setSimulatePredictionMessage(`Error: ${data.error || 'Something went wrong.'}`);
      }
    } catch (error) {
      console.error('Error simulating prediction:', error);
      setSimulatePredictionMessage('Network error or server unreachable.');
    } finally {
      setTimeout(() => setSimulatePredictionMessage(''), 5000); // Clear message after 5 seconds
    }
  };

  // Function to clear the selected prediction (match and outcome)
  const clearSelectedPrediction = () => { // Changed function name
    setSelectedMatch(null);
    setSelectedOutcome(null);
    // localStorage effects will handle clearing the storage
  };

  // Construct the Bitcoin Cash payment URI for the QR code and copy function
  const bchPaymentUri = selectedOutcome?.bch_address && parseFloat(requiredBCH) > 0
    ? `${selectedOutcome.bch_address}?amount=${requiredBCH}`
    : '';

  // console.log("Current selectedOutcome for QR:", selectedOutcome); // Commented out for cleaner console
  // console.log("bchPaymentUri:", bchPaymentUri); // Commented out for cleaner console

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 font-inter antialiased">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <header className="bg-blue-700 text-white p-6 sm:p-8 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <CircleDot size={36} className="text-blue-200" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Club Cup BCH Prediction</h1> {/* Changed "Bets" to "Prediction" */}
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
                    className={`bg-white border border-gray-200 rounded-xl p-5 cursor-pointer transition-all duration-300 ease-in-out transform
                                ${selectedMatch?.match_id === match.match_id
                                  ? 'ring-4 ring-blue-500 shadow-xl scale-105' // More pronounced selection
                                  : 'hover:shadow-lg hover:border-blue-400 hover:-translate-y-1' // Lift effect on hover
                                }`}
                    onClick={() => {
                      setSelectedMatch(match);
                      setSelectedOutcome(null); // Reset outcome selection
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                      {/* Team 1 */}
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-inner">
                          {match.team1.charAt(0)}
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 text-center sm:text-left">{match.team1}</h3>
                      </div>

                      {/* VS */}
                      <span className="text-red-500 text-2xl font-bold mx-2 sm:mx-4">vs</span>

                      {/* Team 2 */}
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end">
                        <h3 className="text-xl font-extrabold text-gray-900 text-center sm:text-right">{match.team2}</h3>
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg shadow-inner">
                          {match.team2.charAt(0)}
                        </div>
                      </div>
                    </div>

                    {/* Date and Possible Scores */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-600 flex items-center mb-2 sm:mb-0">
                        <Clock size={16} className="mr-1 text-gray-400" /> {formatDate(match.match_date)}
                      </span>
                      <span className="text-base font-semibold text-blue-600 flex items-center">
                        <Users size={16} className="mr-1 text-blue-400" /> {Object.keys(match.betting_outcomes).length} possible scores
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No matches available at the moment. Check back soon!</p>
              )}
            </div>
          </section>

          {/* Prediction Outcomes Section (Conditional Rendering) */}
          {selectedMatch && (
            <section className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-blue-800 flex items-center">
                  <Users size={24} className="mr-2 text-blue-600" /> Make Your Prediction for {selectedMatch.team1} vs {selectedMatch.team2} {/* Changed "Bet on" to "Make Your Prediction for" */}
                </h2>
                <button
                  onClick={clearSelectedPrediction} // Changed function call
                  className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                  title="Clear current prediction selection"
                >
                  <XCircle size={18} className="mr-1" /> Clear Selection
                </button>
              </div>
              <p className="text-gray-700 mb-4 text-sm">
                Entry Value: <span className="font-bold text-blue-700">${ticketValueUsd.toFixed(2)} USD</span> (approx. <span className="font-bold text-blue-700">{requiredBCH} BCH</span>)
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
                      {outcome.bet_count} entries {/* Changed "tickets" to "entries" */}
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
                <Zap size={24} className="mr-2 text-green-600" /> Confirm Your Selection {/* Changed "Place Your Bet" to "Confirm Your Selection" */}
              </h2> 
              <p className="text-gray-700 mb-4">
                To make your prediction for score <span className="font-bold text-green-700 text-xl">{selectedOutcome.score}</span>, send your BCH to the address below.
                Each entry costs exactly <span className="font-bold text-green-700 text-xl">{requiredBCH} BCH</span> (for ${ticketValueUsd.toFixed(2)} USD).
                You can make multiple entries by sending multiples of this amount (e.g., { (parseFloat(requiredBCH) * 2).toFixed(8) } BCH for 2 entries). {/* Changed "tickets" to "entries" */}
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
                      <p className="text-sm font-medium text-gray-600">Amount per Entry ($1 USD):</p> {/* Changed "Ticket" to "Entry" */}
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
                * Ensure you send the exact amount per entry. Payments from non-originating addresses or with incorrect amounts may not be counted. {/* Changed "ticket" to "entry" */}
              </p>
            </section>
          )}

          {/* Simulate Prediction Section (Updated) */}
          <section className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200 shadow-md">
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4 flex items-center">
              <Send size={24} className="mr-2 text-yellow-600" /> Simulate a Prediction (for Testing) {/* Changed "Simulate a Bet" to "Simulate a Prediction" */}
            </h2>
            <p className="text-gray-700 mb-4">
              Use this form to simulate a user sending BCH to a prediction outcome address. {/* Changed "betting" to "prediction" */}
              The origin address and the BCH amount will be randomly generated by the backend.
            </p>
            <form onSubmit={handleSimulatePrediction} className="space-y-4"> {/* Changed function call */}
              <div>
                <label htmlFor="simulateMatchId" className="block text-sm font-medium text-gray-700">Match ID:</label>
                <select
                  id="simulateMatchId"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={simulatePredictionMatchId} // Changed state variable
                  onChange={(e) => {
                    setSimulatePredictionMatchId(e.target.value); // Changed state variable
                    setSimulatePredictionOutcomeId(''); // Changed state variable
                  }}
                  required
                >
                  <option value="">Select a Match</option>
                  {matches.map(match => (
                    <option key={match.match_id} value={match.match_id}>
                      {match.team1} vs {match.team2} ({formatDate(match.match_date)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="simulateOutcomeId" className="block text-sm font-medium text-gray-700">Score Outcome:</label>
                <select
                  id="simulateOutcomeId"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={simulatePredictionOutcomeId} // Changed state variable
                  onChange={(e) => setSimulatePredictionOutcomeId(e.target.value)} // Changed state variable
                  required
                  disabled={!simulatePredictionMatchId} // Changed state variable
                >
                  <option value="">Select an Outcome</option>
                  {simulatePredictionMatchId && matches.find(m => m.match_id === simulatePredictionMatchId)?.betting_outcomes &&
                    Object.entries(matches.find(m => m.match_id === simulatePredictionMatchId).betting_outcomes).map(([outcomeId, outcome]) => (
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
                <span>Simulate Prediction</span> {/* Changed "Simulate Bet" to "Simulate Prediction" */}
              </button>
              {simulatePredictionMessage && ( // Changed state variable
                <p className="mt-2 text-center text-sm font-medium">
                  {simulatePredictionMessage.startsWith('Success') ? ( // Changed state variable
                    <span className="text-green-600 flex items-center justify-center"><CheckCircle size={16} className="mr-1" /> {simulatePredictionMessage}</span> // Changed state variable
                  ) : (
                    <span className="text-red-700 flex items-center justify-center"><AlertCircle size={16} className="mr-1" /> {simulatePredictionMessage}</span> // Changed state variable
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
