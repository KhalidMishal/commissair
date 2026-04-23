"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowPathIcon, PaperAirplaneIcon, SparklesIcon, WalletIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const BIDDING_PHASE_SECONDS = 10n;
const SEARCH_TIMEOUT_SECONDS = 180n;
const COMMISSION_PAGE_SIZE = 25n;
const demoBaselineKey = (chainId: number) => `commissair:demoBaseline:${chainId}`;

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
  return "Search timed out and budget refunded";
};

const resultText = (value: string) => {
  if (!value) return "";
  return value.startsWith("mock://") ? value.replace("mock://", "") : value;
};

const ChatBubble = ({ side, children }: { side: "start" | "end"; children: React.ReactNode }) => (
  <div className={`chat ${side === "end" ? "chat-end" : "chat-start"}`}>
    <div
      className={`chat-bubble max-w-[85%] ${
        side === "end"
          ? "chat-bubble-primary shadow-[0_10px_30px_rgba(158,208,255,0.16)]"
          : "border border-primary/10 bg-base-200 text-base-content"
      }`}
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
  const [hiddenBeforeCommissionId, setHiddenBeforeCommissionId] = useState(0n);
  const settlingCommissionIds = useRef(new Set<string>());

  const { data: nextCommissionId } = useScaffoldReadContract({
    contractName: "CommissionMarket",
    functionName: "nextCommissionId",
  });

  const { data: commissions = [], refetch } = useScaffoldReadContract({
    contractName: "CommissionMarket",
    functionName: "getCommissions",
    args: [0n, COMMISSION_PAGE_SIZE],
  });

  useEffect(() => {
    const savedBaseline = window.localStorage.getItem(demoBaselineKey(targetNetwork.id));
    setHiddenBeforeCommissionId(savedBaseline ? BigInt(savedBaseline) : 0n);
  }, [targetNetwork.id]);

  const chatItems = useMemo(() => {
    const lowerAddress = connectedAddress?.toLowerCase();

    return (commissions as readonly Commission[])
      .map((commission, index) => ({ commission, id: BigInt(index) }))
      .filter(({ commission, id }) => {
        const isCurrentWallet = !lowerAddress || commission.consumer.toLowerCase() === lowerAddress;
        return isCurrentWallet && id >= hiddenBeforeCommissionId;
      });
  }, [commissions, connectedAddress, hiddenBeforeCommissionId]);

  const clearVisibleHistory = () => {
    if (nextCommissionId === undefined) return;

    const baseline = BigInt(nextCommissionId);
    window.localStorage.setItem(demoBaselineKey(targetNetwork.id), baseline.toString());
    setHiddenBeforeCommissionId(baseline);
    notification.success("Previous commissions hidden for this browser");
  };

  const cancelExpiredCommission = useCallback(
    async (commissionId: bigint) => {
      const key = commissionId.toString();
      if (settlingCommissionIds.current.has(key)) return;

      settlingCommissionIds.current.add(key);
      try {
        await writeContractAsync(
          {
            functionName: "cancelOpenCommission",
            args: [commissionId],
          },
          {
            onBlockConfirmation: () => {
              notification.success("Search timed out and budget was refunded");
              refetch();
            },
          },
        );
      } catch {
        settlingCommissionIds.current.delete(key);
      }
    },
    [refetch, writeContractAsync],
  );

  useEffect(() => {
    if (!connectedAddress) return;

    const intervalId = window.setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const expiredOpenCommission = chatItems.find(
        ({ commission, id }) =>
          commission.status === 0 &&
          now > commission.bidDeadline + SEARCH_TIMEOUT_SECONDS - BIDDING_PHASE_SECONDS &&
          !settlingCommissionIds.current.has(id.toString()),
      );

      if (expiredOpenCommission) {
        void cancelExpiredCommission(expiredOpenCommission.id);
      }
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, [cancelExpiredCommission, chatItems, connectedAddress]);

  const sendPrompt = async (event: FormEvent) => {
    event.preventDefault();

    await writeContractAsync(
      {
        functionName: "createCommission",
        args: [prompt.trim(), BIDDING_PHASE_SECONDS],
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
    <main className="page-reveal flex min-h-screen flex-col bg-base-200">
      <section className="border-b border-primary/10 bg-base-100/80 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <SparklesIcon className="h-5 w-5" />
              Commissair
            </div>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">Decentralized AI chat on Monad</h1>
          </div>
          <div className="text-sm text-base-content/60">
            Network: <span className="font-semibold text-primary">{targetNetwork.name}</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grow gap-5 px-5 py-5 lg:grid-cols-[1fr_300px]">
        <div className="panel-reveal panel-reveal-delay-1 flex min-h-[70vh] flex-col rounded-box border border-primary/10 bg-base-100 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
          <div className="border-b border-primary/10 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">AI Session</h2>
                <p className="text-sm text-base-content/60">
                  Bidding runs for {BIDDING_PHASE_SECONDS.toString()} seconds. Searches time out after 3 minutes without
                  bids.
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

          <form className="border-t border-primary/10 bg-base-300/30 p-4" onSubmit={sendPrompt}>
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="input input-bordered flex items-center gap-2 border-primary/15 bg-base-200 md:w-36">
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
                className="input input-bordered flex-1 border-primary/15 bg-base-200"
                placeholder="Ask for a research brief, image, code patch, file conversion..."
                required
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
              />
              <button
                className="btn btn-primary transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(158,208,255,0.2)]"
                disabled={!connectedAddress || isMining}
                type="submit"
              >
                {isMining ? <span className="loading loading-spinner" /> : <PaperAirplaneIcon className="h-5 w-5" />}
                Send
              </button>
            </div>
          </form>
        </div>

        <aside className="panel-reveal panel-reveal-delay-2 space-y-4">
          <div className="stats stats-vertical w-full border border-primary/10 bg-base-100 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="stat">
              <div className="stat-title">Prompts</div>
              <div className="stat-value text-2xl">{chatItems.length.toString()}</div>
              <div className="stat-desc">Visible sessions</div>
            </div>
            <div className="stat">
              <div className="stat-title">Auction</div>
              <div className="stat-value text-2xl">{BIDDING_PHASE_SECONDS.toString()}s</div>
              <div className="stat-desc">Lowest bid window</div>
            </div>
            <div className="stat">
              <div className="stat-title">Timeout</div>
              <div className="stat-value text-2xl">3m</div>
              <div className="stat-desc">No-bid cancellation</div>
            </div>
          </div>

          <button
            className="btn btn-outline btn-primary w-full"
            disabled={nextCommissionId === undefined}
            onClick={clearVisibleHistory}
            type="button"
          >
            Clear visible history
          </button>

          <div className="rounded-box border border-primary/10 bg-base-100 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <h2 className="font-semibold">Provider Node</h2>
            <div className="mt-3 rounded-box border border-primary/10 bg-base-200 p-3 font-mono text-xs text-primary">
              yarn server:start
            </div>
            <p className="mt-3 text-sm text-base-content/60">
              The Gemini provider bids, finalizes the lowest bid, returns a generated result, and receives payment
              automatically.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default Home;
