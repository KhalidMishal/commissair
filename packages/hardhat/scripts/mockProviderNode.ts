import { ethers } from "hardhat";
import { CommissionMarket } from "../typechain-types";

const POLL_INTERVAL_MS = 1_000;
const DEFAULT_BID = ethers.parseEther(process.env.PROVIDER_BID_MON || "0.05");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const [, providerSigner] = await ethers.getSigners();
  const market = (await ethers.getContract("CommissionMarket", providerSigner)) as CommissionMarket;
  const providerAddress = await providerSigner.getAddress();

  console.log(`Provider node online: ${providerAddress}`);
  console.log(`Default bid: ${ethers.formatEther(DEFAULT_BID)} MON`);

  const seenBids = new Set<string>();
  const submitted = new Set<string>();

  while (true) {
    const nextCommissionId = await market.nextCommissionId();

    for (let commissionId = 0n; commissionId < nextCommissionId; commissionId++) {
      const commission = await market.getCommission(commissionId);
      const status = Number(commission.status);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const bidKey = commissionId.toString();

      if (status === 0 && now <= commission.bidDeadline && !seenBids.has(bidKey)) {
        const bidAmount = DEFAULT_BID < commission.maxBudget ? DEFAULT_BID : commission.maxBudget;
        const tx = await market.placeBid(commissionId, bidAmount, `mock://provider/${providerAddress}`);
        await tx.wait();
        seenBids.add(bidKey);
        console.log(`Bid ${ethers.formatEther(bidAmount)} MON on commission #${commissionId}`);
      }

      if (status === 0 && now > commission.bidDeadline) {
        const bids = await market.getCommissionBids(commissionId);
        if (bids.length > 0) {
          try {
            const tx = await market.finalizeLowestBid(commissionId);
            await tx.wait();
            console.log(`Finalized lowest bid for commission #${commissionId}`);
          } catch (error) {
            console.log(`Finalize skipped for #${commissionId}: ${(error as Error).message}`);
          }
        }
      }

      if (
        status === 1 &&
        commission.creator.toLowerCase() === providerAddress.toLowerCase() &&
        !submitted.has(bidKey)
      ) {
        const response = [
          "Mock provider response",
          "",
          `Prompt: ${commission.promptURI}`,
          "",
          "This placeholder stands in for local GPU/LLM work. In the full node, this is where the provider runs the model and uploads a file or text result.",
        ].join("\n");
        const tx = await market.submitDelivery(commissionId, `mock://${response}`);
        await tx.wait();
        submitted.add(bidKey);
        console.log(`Submitted result and claimed payment for commission #${commissionId}`);
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
