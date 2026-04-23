import * as dotenv from "dotenv";
dotenv.config();

import { ethers } from "hardhat";
import { GoogleGenAI } from "@google/genai";
import { CommissionMarket } from "../typechain-types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 1_000;

const DEFAULT_BID = ethers.parseEther(process.env.PROVIDER_BID_MON || "0.05");
const GEMINI_MODEL = process.env.PROVIDER_GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set in your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call the Gemini API with the user's raw prompt text and return the response.
 * The result is prefixed with "mock://" so the existing frontend resultText()
 * helper strips it and displays it as a plain chat message — no frontend edits needed.
 */
async function runGemini(prompt: string): Promise<string> {
  console.log(`  → Calling Gemini (${GEMINI_MODEL}) ...`);
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  const text = response.text ?? "(no response)";
  // Prefix with "mock://" — the frontend's resultText() strips this prefix.
  return `mock://${text}`;
}

// ---------------------------------------------------------------------------
// Main poll loop
// ---------------------------------------------------------------------------

async function main() {
  const [, providerSigner] = await ethers.getSigners();
  const market = (await ethers.getContract("CommissionMarket", providerSigner)) as CommissionMarket;
  const providerAddress = await providerSigner.getAddress();

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     Commissair — Gemini Provider Node            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Provider address : ${providerAddress}`);
  console.log(`Default bid      : ${ethers.formatEther(DEFAULT_BID)} MON`);
  console.log(`Gemini model     : ${GEMINI_MODEL}`);
  console.log("Listening for commissions...\n");

  // Track which commissions we have already bid on / submitted for.
  const seenBids = new Set<string>();
  const submitted = new Set<string>();

  while (true) {
    try {
      const nextCommissionId = await market.nextCommissionId();

      for (let commissionId = 0n; commissionId < nextCommissionId; commissionId++) {
        const commission = await market.getCommission(commissionId);
        const status = Number(commission.status);
        const now = BigInt(Math.floor(Date.now() / 1000));
        const key = commissionId.toString();

        // ------------------------------------------------------------------
        // Phase 1 — Bid on open commissions while the auction window is open
        // ------------------------------------------------------------------
        if (status === 0 && now <= commission.bidDeadline && !seenBids.has(key)) {
          const bidAmount = DEFAULT_BID < commission.maxBudget ? DEFAULT_BID : commission.maxBudget;
          const tx = await market.placeBid(commissionId, bidAmount, `gemini://provider/${providerAddress}`);
          await tx.wait();
          seenBids.add(key);
          console.log(`[#${key}] Bid placed: ${ethers.formatEther(bidAmount)} MON`);
        }

        // ------------------------------------------------------------------
        // Phase 2 — Finalize the lowest bid once the auction window closes
        //           (anyone may call finalizeLowestBid — we do it as a service)
        // ------------------------------------------------------------------
        if (status === 0 && now > commission.bidDeadline) {
          const bids = await market.getCommissionBids(commissionId);
          if (bids.length > 0) {
            try {
              const tx = await market.finalizeLowestBid(commissionId);
              await tx.wait();
              console.log(`[#${key}] Auction finalized — lowest bid wins`);
            } catch {
              // Another node may have already finalized it — silently ignore.
            }
          }
        }

        // ------------------------------------------------------------------
        // Phase 3 — We won: run the prompt through Gemini and submit result
        // ------------------------------------------------------------------
        if (
          status === 1 &&
          commission.creator.toLowerCase() === providerAddress.toLowerCase() &&
          !submitted.has(key)
        ) {
          submitted.add(key); // mark first so a crash won't retry endlessly in this session
          console.log(`[#${key}] Commission assigned to us — generating response...`);
          console.log(`  Prompt: "${commission.promptURI.slice(0, 80)}${commission.promptURI.length > 80 ? "…" : ""}"`);

          try {
            const resultURI = await runGemini(commission.promptURI);
            const tx = await market.submitDelivery(commissionId, resultURI);
            await tx.wait();
            console.log(`[#${key}] Delivery submitted — payment released to provider ✓`);
          } catch (err) {
            submitted.delete(key); // allow a retry next tick if Gemini failed
            console.error(`[#${key}] Generation failed:`, (err as Error).message);
          }
        }
      }
    } catch (err) {
      console.error("Poll error:", (err as Error).message);
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
