const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env"), quiet: true });
const { ethers } = require("ethers");
const { initGemini } = require("./gemini");

// Environment Variables
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = normalizePrivateKey(process.env.PRIVATE_KEY);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || "2000");
const PROVIDER_BID = ethers.parseEther(process.env.PROVIDER_BID_MON || "0.005");

if (!PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("❌ Missing PRIVATE_KEY or CONTRACT_ADDRESS in environment variables.");
  process.exit(1);
}

function normalizePrivateKey(value) {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

// Minimal ABI required for the server
const contractABI = [
  "event CommissionCreated(uint256 indexed commissionId, address indexed consumer, uint256 maxBudget, uint256 bidDeadline, string promptURI)",
  "event BidAccepted(uint256 indexed commissionId, uint256 indexed bidId, address indexed creator, uint256 amount)",
  "function nextCommissionId() external view returns (uint256)",
  "function placeBid(uint256 commissionId, uint256 amount, string calldata endpointURI) external returns (uint256 bidId)",
  "function finalizeLowestBid(uint256 commissionId) external",
  "function settleExpiredCommission(uint256 commissionId) external",
  "function submitDelivery(uint256 commissionId, string calldata resultURI) external",
  "function getCommission(uint256 commissionId) external view returns (tuple(address consumer, address creator, uint256 maxBudget, uint256 acceptedAmount, uint256 bidDeadline, uint256 reviewDeadline, uint8 status, string promptURI, string resultURI))",
  "function getCommissions(uint256 startId, uint256 limit) external view returns (tuple(address consumer, address creator, uint256 maxBudget, uint256 acceptedAmount, uint256 bidDeadline, uint256 reviewDeadline, uint8 status, string promptURI, string resultURI)[])",
  "function getCommissionBids(uint256 commissionId) external view returns (tuple(address creator, uint256 amount, string endpointURI, bool active)[])",
];

async function main() {
  console.log("🚀 Starting Monad AI Market Provider Server...");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);

  console.log(`✅ Connected as Provider: ${wallet.address}`);
  console.log(`📡 Listening to CommissionMarket at: ${CONTRACT_ADDRESS}`);
  console.log(`💸 Provider bid: ${ethers.formatEther(PROVIDER_BID)} MON`);

  const generateAIResponse = initGemini(GEMINI_API_KEY);

  const seenBids = new Set();
  const submitted = new Set();
  const inFlight = new Set();

  const handleCommissionWithData = async (commissionId, commission) => {
    const key = commissionId.toString();
    if (inFlight.has(key)) return;

    inFlight.add(key);
    try {
      const status = Number(commission.status);
      const now = BigInt(Math.floor(Date.now() / 1000));

      if (status === 0 && now <= commission.bidDeadline && !seenBids.has(key)) {
        const bids = await contract.getCommissionBids(commissionId);
        const alreadyBid = bids.some(bid => bid.creator.toLowerCase() === wallet.address.toLowerCase());
        if (alreadyBid) {
          seenBids.add(key);
          return;
        }

        const bidAmount = PROVIDER_BID < commission.maxBudget ? PROVIDER_BID : commission.maxBudget;
        if (bidAmount === 0n) {
          console.log(`[#${key}] Skipping commission with zero budget.`);
          return;
        }

        console.log(`\n🔔 [New Commission] #${key}`);
        console.log(`   Budget: ${ethers.formatEther(commission.maxBudget)} MON`);
        console.log(`   Prompt: "${commission.promptURI}"`);
        console.log(`   Placing bid: ${ethers.formatEther(bidAmount)} MON`);

        const tx = await contract.placeBid(commissionId, bidAmount, `gemini://provider/${wallet.address}`, { gasLimit: 500000 });
        await tx.wait();
        seenBids.add(key);
        console.log(`   ✅ Bid placed: ${tx.hash}`);
      }

      if (status === 0 && now > commission.bidDeadline) {
        try {
          console.log(`[#${key}] Settling expired commission...`);
          const tx = await contract.settleExpiredCommission(commissionId, { gasLimit: 500000 });
          await tx.wait();
          console.log(`[#${key}] ✅ Expired commission settled: ${tx.hash}`);
        } catch (error) {
          const bids = await contract.getCommissionBids(commissionId);
          if (bids.length > 0) {
            try {
              console.log(`[#${key}] Settlement unavailable; finalizing lowest bid...`);
              const tx = await contract.finalizeLowestBid(commissionId, { gasLimit: 500000 });
              await tx.wait();
              console.log(`[#${key}] ✅ Auction finalized: ${tx.hash}`);
            } catch (finalizeError) {
              console.log(`[#${key}] Finalize skipped: ${finalizeError.shortMessage || finalizeError.message}`);
            }
          } else {
            console.log(`[#${key}] Settle skipped: ${error.shortMessage || error.message}`);
          }
        }
      }

      if (
        status === 1 &&
        commission.creator.toLowerCase() === wallet.address.toLowerCase() &&
        !submitted.has(key)
      ) {
        submitted.add(key);
        console.log(`\n🎉 [Bid Won] Commission #${key}`);
        console.log(`   Generating Gemini response...`);

        try {
          const aiResponseText = await generateAIResponse(commission.promptURI);
          console.log(`   Submitting delivery (${aiResponseText.length} chars)...`);
          const tx = await contract.submitDelivery(commissionId, aiResponseText, { gasLimit: 1000000 });
          await tx.wait();
          console.log(`   ✅ Delivery submitted: ${tx.hash}`);
          console.log(`   💰 Escrow released automatically.`);
        } catch (error) {
          submitted.delete(key);
          console.error(`   ❌ Failed to generate or submit delivery:`, error.shortMessage || error.message);
        }
      }
    } catch (error) {
      console.error(`[#${key}] Provider error:`, error.shortMessage || error.message);
    } finally {
      inFlight.delete(key);
    }
  };

  let isPolling = false;
  const scanCommissions = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const nextCommissionId = await contract.nextCommissionId();
      if (nextCommissionId === 0n) return;

      // Batch fetch all commissions
      const commissions = await contract.getCommissions(0, nextCommissionId);
      for (let i = 0; i < commissions.length; i++) {
        const commissionId = BigInt(i);
        const commission = commissions[i];
        
        // Skip already completed/cancelled
        const status = Number(commission.status);
        if (status > 1) continue; 

        await handleCommissionWithData(commissionId, commission);
      }
    } finally {
      isPolling = false;
    }
  };



  console.log(`🔁 Polling commissions every ${POLL_INTERVAL_MS}ms.`);
  scanCommissions().catch(error => {
    console.error("Initial poll error:", error.shortMessage || error.message);
  });
  setInterval(() => {
    scanCommissions().catch(error => {
      console.error("Poll error:", error.shortMessage || error.message);
    });
  }, POLL_INTERVAL_MS);

}

main().catch((error) => {
  console.error("Fatal Error:", error);
  process.exit(1);
});
