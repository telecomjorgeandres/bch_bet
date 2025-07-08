BCH Betting Frontend
This repository contains the React.js frontend application for the Club Cup BCH Betting platform. It consumes API endpoints from the associated Django backend to display match data, BCH exchange rates, and facilitate simulated betting interactions.

Table of Contents
Description

Features

Technologies Used

Setup and Installation

Prerequisites

Cloning the Repository

Install Dependencies

Running the Development Server

Backend Integration

Available Scripts

License

Description
The bch_bet frontend is a single-page application (SPA) built with React. It provides a user interface for viewing upcoming football matches, checking the real-time BCH to USD exchange rate, selecting betting outcomes, and simulating bets by interacting with the backend API.

Features
Displays a list of upcoming football matches.

Shows real-time BCH to USD exchange rate.

Allows users to select a match and then choose a specific score outcome.

Calculates the required BCH amount for a bet based on a fixed USD ticket value.

Generates a BCH payment URI and QR code for simulated betting.

Includes a form to simulate bet transactions for testing purposes.

Responsive design for various screen sizes.

Technologies Used
React.js 19.x: For building the user interface.

Tailwind CSS 3.x: For utility-first CSS styling.

lucide-react: For lightweight and customizable icons.

JavaScript (ES6+)

npm (Node Package Manager)

Setup and Installation
Follow these steps to get the frontend application running on your local machine.

Prerequisites
Node.js (v18 or higher recommended)

npm (comes with Node.js)

Cloning the Repository
First, clone this frontend repository to your local machine:

git clone https://github.com/your-username/bch_bet.git # Replace with your actual repo URL
cd bch_bet

Install Dependencies
Once you are in the project directory, install the required Node.js packages:

npm install

This command will install all dependencies listed in package.json, including React, Tailwind CSS, and lucide-react.

Running the Development Server
After installing dependencies, you can start the development server:

npm start

This will open the application in your browser at http://localhost:3000/ (or another available port). The app will automatically reload if you make changes to the code.

Backend Integration
This frontend application relies on a separate Django backend. Ensure your backend is running and accessible at http://localhost:8000/. The frontend makes API calls to the following endpoints:

http://localhost:8000/api/matches/

http://localhost:8000/api/bch-rate/

http://localhost:8000/api/simulate-bet/

Please refer to the backend repository's README for its setup instructions.

Available Scripts
In the project directory, you can run:

npm start: Runs the app in development mode.

npm run build: Builds the app for production to the build folder.

npm test: Launches the test runner.

npm run eject: Removes the single build dependency from your project (use with caution).

License
This project is licensed under the MIT License - see the LICENSE file for details (if you plan to add one).