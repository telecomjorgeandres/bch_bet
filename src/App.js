import React from 'react';
import logo from './logo.svg'; // Added this line to import the logo
import './App.css';
import BCHPriceDisplay from './components/BCHPriceDisplay'; // Import the new component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* Integrate the BCHPriceDisplay component here */}
        <BCHPriceDisplay /> 
        
        {/* Original boilerplate content below */}
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
