// src/components/BCHPriceDisplay.js
import React, { useState, useEffect } from 'react';

// Accept onRateUpdate as a prop
function BCHPriceDisplay({ onRateUpdate }) {
  const [bchPrice, setBCHPrice] = useState('Loading...');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // Function to fetch initial BCH price via HTTP
    const fetchInitialBCHPrice = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/bch-rate/');
        if (response.ok) {
          const data = await response.json();
          const newRate = parseFloat(data.rate);
          setBCHPrice(newRate.toFixed(2));
          if (onRateUpdate) {
            onRateUpdate(newRate);
          }
          const date = new Date(data.timestamp);
          setLastUpdated(date.toLocaleTimeString());
          console.log('Fetched initial BCH rate via HTTP:', newRate);
        } else {
          console.error('Failed to fetch initial BCH rate:', response.statusText);
          setBCHPrice('N/A');
        }
      } catch (error) {
        console.error('Error fetching initial BCH rate:', error);
        setBCHPrice('Error');
      }
    };

    // Call the function to fetch initial price immediately on mount
    fetchInitialBCHPrice();

    // Establish WebSocket connection for real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws/bch_rate/');

    ws.onopen = () => {
      console.log('WebSocket connected to BCH rate updates');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received BCH rate update via WebSocket:', data);

      if (data && data.rate) {
        const newRate = parseFloat(data.rate);
        setBCHPrice(newRate.toFixed(2)); // Format for display
        
        // Call the prop function to send the new rate to the parent
        if (onRateUpdate) {
          onRateUpdate(newRate);
        }

        const date = new Date(data.timestamp);
        setLastUpdated(date.toLocaleTimeString());
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected from BCH rate updates');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [onRateUpdate]); // Add onRateUpdate to dependency array

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-md flex items-center justify-between">
      <span className="text-lg font-semibold">1 BCH = ${bchPrice} USD</span>
      {lastUpdated && <span className="text-sm text-gray-400 ml-4">Last updated: {lastUpdated}</span>}
    </div>
  );
}

export default BCHPriceDisplay;
