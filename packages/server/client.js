require("dotenv").config();
const { ethers } = require("ethers");

// Environment Variables
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// We use a different default hardhat account for the "User" so it doesn't conflict with the "Provider" server
// Hardhat Account #2
const USER_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"; 

if (!CONTRACT_ADDRESS) {
  console.error("❌ Missing CONTRACT_ADDRESS in .env");
  process.exit(1);
}

const contractABI = [
  "function createCommission(string calldata promptURI, uint256 bidWindow) external payable returns (uint256 commissionId)"
];

async function main() {
  console.log("👤 Starting User Client Simulator...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(USER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

  const prompt = "Please write a haiku about an AI server winning an auction.";
  const bidWindow = 5; // 5 seconds
  const maxBudget = ethers.parseEther("0.1"); // 0.1 ETH

  console.log(`\n📝 Submitting Prompt: "${prompt}"`);
  console.log(`💰 Escrowing Budget: ${ethers.formatEther(maxBudget)} ETH`);
  console.log(`⏱️  Bid Window: ${bidWindow} seconds`);

  try {
    const tx = await contract.createCommission(prompt, bidWindow, { value: maxBudget });
    console.log(`   ⏳ Transaction sent... Waiting for confirmation (TX: ${tx.hash})`);
    await tx.wait();
    console.log(`   ✅ Commission created successfully on the blockchain!`);
    console.log(`\n👉 Now look at your Server's terminal to watch it bid, win, and process the result!`);
  } catch (error) {
    console.error("❌ Error creating commission:", error.message);
  }
}

main().catch(console.error);
