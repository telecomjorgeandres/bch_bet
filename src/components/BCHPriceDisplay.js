// In src/components/BCHPriceDisplay.js

import React, { useState, useEffect } from 'react';

// Accept onRateUpdate as a prop
function BCHPriceDisplay({ onRateUpdate }) {
  const [bchPrice, setBCHPrice] = useState('Loading...');
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState('');
  const [isUpdated, setIsUpdated] = useState(false); // State for the flash effect

  useEffect(() => {
    // Function to fetch initial BCH price via HTTP
    const fetchInitialBCHPrice = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/bch-rate/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const newRate = parseFloat(data.rate);
        setBCHPrice(newRate.toFixed(2));
        if (onRateUpdate) {
          onRateUpdate(newRate);
        }
        const date = new Date(data.timestamp);
        setLastUpdated(date.toLocaleTimeString());
        console.log('Fetched initial BCH rate via HTTP:', newRate);
      } catch (error) {
        console.error('Error fetching initial BCH rate:', error);
        setBCHPrice('Error');
        setError('Could not fetch initial price.');
      }
    };

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
        setBCHPrice(newRate.toFixed(2));
        
        if (onRateUpdate) {
          onRateUpdate(newRate);
        }

        const date = new Date(data.timestamp);
        setLastUpdated(date.toLocaleTimeString());

        // Trigger the flash effect
        setIsUpdated(true);
        setTimeout(() => setIsUpdated(false), 500); // Reset after 500ms
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected from BCH rate updates');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error.');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [onRateUpdate]); // Dependency array ensures this effect runs once

  // Base classes for the component
  const baseClasses = "text-white p-4 rounded-lg shadow-md flex items-center justify-between space-x-4 transition-colors duration-500 ease-in-out";
  // Dynamic class for the background flash
  const updatedClass = isUpdated ? "bg-green-600" : "bg-gray-800";

  return (
    <div className={`${baseClasses} ${updatedClass}`}>
      
      {/* Price Information */}
      <div className="text-lg font-semibold whitespace-nowrap">
        1 BCH = ${bchPrice} USD
      </div>

      {/* Last Updated Time */}
      <div className="text-xs text-gray-400 text-right flex-shrink-0">
        <div>Last updated:</div>
        <div className="font-mono">{lastUpdated.replace(' ', '\u00A0')}</div>
      </div>
      
    </div>
  );
}

export default BCHPriceDisplay;
