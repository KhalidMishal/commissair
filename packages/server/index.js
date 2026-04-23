require("dotenv").config();
const { ethers } = require("ethers");
const { initGemini } = require("./gemini");

// Environment Variables
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("❌ Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment variables.");
  process.exit(1);
}

// Minimal ABI required for the server
const contractABI = [
  "event CommissionCreated(uint256 indexed commissionId, address indexed consumer, uint256 maxBudget, uint256 bidDeadline, string promptURI)",
  "event BidAccepted(uint256 indexed commissionId, uint256 indexed bidId, address indexed creator, uint256 amount)",
  "function placeBid(uint256 commissionId, uint256 amount, string calldata endpointURI) external returns (uint256 bidId)",
  "function finalizeLowestBid(uint256 commissionId) external",
  "function submitDelivery(uint256 commissionId, string calldata resultURI) external",
  "function getCommission(uint256 commissionId) external view returns (tuple(address consumer, address creator, uint256 maxBudget, uint256 acceptedAmount, uint256 bidDeadline, uint256 reviewDeadline, uint8 status, string promptURI, string resultURI))",
];

async function main() {
  console.log("🚀 Starting Monad AI Market Provider Server...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

  console.log(`✅ Connected as Provider: ${wallet.address}`);
  console.log(`📡 Listening to CommissionMarket at: ${CONTRACT_ADDRESS}`);

  const generateAIResponse = initGemini(GEMINI_API_KEY);

  // In-memory store to keep track of prompts we bid on
  const pendingPrompts = new Map();

  // 1. Listen for new commissions
  contract.on("CommissionCreated", async (commissionId, consumer, maxBudget, bidDeadline, promptURI, event) => {
    console.log(`\n🔔 [New Commission] ID: ${commissionId.toString()} | Budget: ${ethers.formatEther(maxBudget)} ETH`);
    console.log(`   Prompt: "${promptURI}"`);

    // For the hackathon MVP, we place a bid of roughly 5% of maxBudget or a small fixed amount
    const bidAmount = maxBudget / 20n; // Use BigInt division
    const endpointURI = "https://example-provider-endpoint.ai";

    try {
      console.log(`   💸 Placing bid of ${ethers.formatEther(bidAmount)} ETH...`);
      const tx = await contract.placeBid(commissionId, bidAmount, endpointURI);
      await tx.wait();
      console.log(`   ✅ Bid placed! TX: ${tx.hash}`);

      // Store prompt in memory so we can use it if we win
      pendingPrompts.set(commissionId.toString(), promptURI);

      // We act as the backend indexer: automatically call finalizeLowestBid after deadline
      // Wait until deadline + 1 second buffer
      const now = Math.floor(Date.now() / 1000);
      const waitSeconds = Number(bidDeadline) - now + 1;
      const waitMs = Math.max(1000, waitSeconds * 1000); // Wait at least 1 second

      console.log(`   ⏱️ Waiting ${waitMs}ms to trigger auction finalization...`);
      setTimeout(async () => {
        try {
          console.log(`   ⏳ Finalizing bids for Commission #${commissionId.toString()}...`);
          const finalizeTx = await contract.finalizeLowestBid(commissionId);
          await finalizeTx.wait();
          console.log(`   ✅ Auction finalized for #${commissionId.toString()}`);
        } catch (err) {
          console.error(`   ❌ Failed to finalize auction for #${commissionId.toString()}:`, err.message);
        }
      }, waitMs);

    } catch (error) {
      console.error(`   ❌ Failed to place bid on commission #${commissionId.toString()}:`, error.message);
    }
  });

  // 2. Listen for accepted bids
  contract.on("BidAccepted", async (commissionId, bidId, creator, amount, event) => {
    // Check if WE are the winner
    if (creator.toLowerCase() === wallet.address.toLowerCase()) {
      console.log(`\n🎉 [Bid Won!] Commission #${commissionId.toString()} | Earning: ${ethers.formatEther(amount)} ETH`);
      
      let promptURI = pendingPrompts.get(commissionId.toString());
      if (!promptURI) {
        // If we restarted or lost memory, fetch it
        const commissionData = await contract.getCommission(commissionId);
        promptURI = commissionData.promptURI;
      }

      console.log(`   🤖 Generating AI response for: "${promptURI}"`);
      
      // Call Gemini API
      const aiResponseText = await generateAIResponse(promptURI);

      try {
        console.log(`   📤 Submitting delivery...`);
        const tx = await contract.submitDelivery(commissionId, aiResponseText);
        await tx.wait();
        console.log(`   ✅ Delivery submitted! TX: ${tx.hash}`);
        console.log(`   💰 Escrow has been automatically released to us.`);
      } catch (error) {
        console.error(`   ❌ Failed to submit delivery:`, error.message);
      }
    } else {
      console.log(`\n📉 [Bid Lost] Commission #${commissionId.toString()} went to ${creator}`);
    }
  });

}

main().catch((error) => {
  console.error("Fatal Error:", error);
  process.exit(1);
});
