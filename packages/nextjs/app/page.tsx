"use client";

import { FormEvent, useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowPathIcon, BoltIcon, PaperAirplaneIcon, SparklesIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const AUCTION_SECONDS = 5n;
const COMMISSION_PAGE_SIZE = 25n;

type Commission = {
  consumer: string;
  creator: string;
  maxBudget: bigint;
  acceptedAmount: bigint;
  bidDeadline: bigint;
  reviewDeadline: bigint;
  status: number;
  promptURI: string;
  resultURI: string;
};

const formatMon = (value: bigint) =>
  `${Number(formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 4 })} MON`;

const statusCopy = (commission: Commission) => {
  if (commission.status === 0) return "Finding the best available provider";
  if (commission.status === 1) return "Provider selected and generating";
  if (commission.status === 2) return "Result received";
  if (commission.status === 3) return `Paid ${formatMon(commission.acceptedAmount)} to the provider`;
  return "Session cancelled";
};

const resultText = (value: string) => {
  if (!value) return "";
  return value.startsWith("mock://") ? value.replace("mock://", "") : value;
};

const ChatBubble = ({ side, children }: { side: "start" | "end"; children: React.ReactNode }) => (
  <div className={`chat ${side === "end" ? "chat-end" : "chat-start"}`}>
    <div
      className={`chat-bubble max-w-[85%] ${side === "end" ? "chat-bubble-primary" : "bg-base-200 text-base-content"}`}
    >
      {children}
    </div>
  </div>
);

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "CommissionMarket" });

  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState("0.25");

  const { data: nextCommissionId } = useScaffoldReadContract({
    contractName: "CommissionMarket",
    functionName: "nextCommissionId",
  });

  const { data: commissions = [], refetch } = useScaffoldReadContract({
    contractName: "CommissionMarket",
    functionName: "getCommissions",
    args: [0n, COMMISSION_PAGE_SIZE],
  });

  const chatItems = useMemo(() => {
    const lowerAddress = connectedAddress?.toLowerCase();

    return (commissions as readonly Commission[])
      .map((commission, index) => ({ commission, id: BigInt(index) }))
      .filter(({ commission }) => !lowerAddress || commission.consumer.toLowerCase() === lowerAddress);
  }, [commissions, connectedAddress]);

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault();

    await writeContractAsync(
      {
        functionName: "createCommission",
        args: [prompt.trim(), AUCTION_SECONDS],
        value: parseEther(budget || "0"),
      },
      {
        onBlockConfirmation: () => {
          notification.success("Prompt sent to the provider network");
          setPrompt("");
          refetch();
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen flex-col bg-base-200">
      <section className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <SparklesIcon className="h-5 w-5" />
              Commissair
            </div>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">Decentralized AI chat on Monad</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="badge badge-outline gap-2 py-3">
              <BoltIcon className="h-4 w-4" />
              {targetNetwork.name}
            </div>
            {connectedAddress ? (
              <div className="rounded-box bg-base-200 px-3 py-2">
                <Address address={connectedAddress} chain={targetNetwork} />
              </div>
            ) : (
              <div className="badge badge-warning gap-2 py-3">
                <WalletIcon className="h-4 w-4" />
                Connect wallet
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grow gap-5 px-5 py-5 lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-[70vh] flex-col rounded-box bg-base-100 shadow">
          <div className="border-b border-base-300 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">AI Session</h2>
                <p className="text-sm text-base-content/60">
                  Reverse auction runs for {AUCTION_SECONDS.toString()} seconds.
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => refetch()} type="button">
                <ArrowPathIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {chatItems.length === 0 ? (
              <div className="grid h-full place-items-center text-center">
                <div className="max-w-md">
                  <SparklesIcon className="mx-auto h-12 w-12 text-primary" />
                  <h2 className="mt-4 text-2xl font-bold">Ask for any AI deliverable</h2>
                  <p className="mt-2 text-base-content/60">
                    Research, text, images, datasets, PDFs, and other files can be fulfilled by provider nodes.
                  </p>
                </div>
              </div>
            ) : (
              chatItems.map(({ commission, id }) => (
                <div key={id.toString()} className="space-y-3">
                  <ChatBubble side="end">
                    <div className="whitespace-pre-wrap break-words">{commission.promptURI}</div>
                    <div className="mt-2 text-xs opacity-70">Budget {formatMon(commission.maxBudget)}</div>
                  </ChatBubble>
                  <ChatBubble side="start">
                    {commission.status === 3 && commission.resultURI ? (
                      <div className="whitespace-pre-wrap break-words">{resultText(commission.resultURI)}</div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="loading loading-dots loading-sm" />
                        <span>{statusCopy(commission)}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs opacity-60">
                      #{id.toString()} · {statusCopy(commission)}
                    </div>
                  </ChatBubble>
                </div>
              ))
            )}
          </div>

          <form className="border-t border-base-300 p-4" onSubmit={sendPrompt}>
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="input input-bordered flex items-center gap-2 md:w-36">
                <WalletIcon className="h-5 w-5 opacity-60" />
                <input
                  className="w-full"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  type="number"
                  value={budget}
                  onChange={event => setBudget(event.target.value)}
                />
              </label>
              <input
                className="input input-bordered flex-1"
                placeholder="Ask for a research brief, image, code patch, file conversion..."
                required
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
              />
              <button className="btn btn-primary" disabled={!connectedAddress || isMining} type="submit">
                {isMining ? <span className="loading loading-spinner" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                Send
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="stats stats-vertical w-full bg-base-100 shadow">
            <div className="stat">
              <div className="stat-title">Prompts</div>
              <div className="stat-value text-2xl">{nextCommissionId?.toString() ?? "0"}</div>
              <div className="stat-desc">On-chain sessions</div>
            </div>
            <div className="stat">
              <div className="stat-title">Auction</div>
              <div className="stat-value text-2xl">{AUCTION_SECONDS.toString()}s</div>
              <div className="stat-desc">Hardcoded MVP window</div>
            </div>
          </div>

          <div className="rounded-box bg-base-100 p-4 shadow">
            <h2 className="font-semibold">Provider Node</h2>
            <div className="mt-3 rounded-box bg-base-200 p-3 font-mono text-xs">
              yarn provider:mock --network localhost
            </div>
            <p className="mt-3 text-sm text-base-content/60">
              The demo node bids, finalizes the lowest bid, returns a mock result, and receives payment automatically.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Home;
