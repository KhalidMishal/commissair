# Monad AI Market Provider Server

This is the middleman server for the Monad AI Market MVP. It acts as both the backend indexer and a Provider Node using the Google Gemini API.

## Features

- Listens to the Monad smart contract for new AI queries (`CommissionCreated`).
- Automatically reverse-bids on active queries.
- Triggers the auction finalization after the time window closes.
- If won, generates the AI response using Google Gemini API (`gemini-1.5-flash`).
- Automatically delivers the result and receives payment from escrow.

## Setup

1. Copy `.env.example` to `.env`.
   ```bash
   cp .env.example .env
   ```
2. Fill in the `.env` variables:
   - `RPC_URL`: The RPC URL of the blockchain (e.g. `http://127.0.0.1:8545` for hardhat).
   - `PRIVATE_KEY`: A funded private key to cover gas for bids and delivery.
   - `CONTRACT_ADDRESS`: The deployed address of `CommissionMarket.sol`.
   - `GEMINI_API_KEY`: Your Google Gemini API key. If omitted, the server will fall back to returning mock generated text.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   npm start
   ```

The server will stay running and listen for events on the blockchain!
