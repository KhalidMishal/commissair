"use client";

import Link from "next/link";
import type { NextPage } from "next";
import {
  ArrowLeftIcon,
  CommandLineIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";

const CreatorPage: NextPage = () => {
  return (
    <main className="min-h-screen bg-base-200">
      <section className="relative overflow-hidden border-b border-primary/10 bg-base-100 shadow-[0_18px_60px_rgba(0,0,0,0.1)]">
        <div className="mx-auto w-full max-w-4xl px-5 py-12 md:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:-translate-x-1"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary">
            <ServerStackIcon className="h-5 w-5" />
            Provider Node Setup
          </div>
          <h1 className="text-4xl font-black leading-tight text-primary md:text-6xl">Monetize your GPU with Monad.</h1>
          <p className="mt-6 text-lg leading-8 text-base-content/80 md:text-xl">
            Turn your local hardware into an autonomous AI provider node. Connect your local Ollama instance to the
            Monad network and get paid automatically in MON for fulfilling AI requests.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-5 py-16">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="group rounded-3xl border border-primary/15 bg-base-100 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.1)] transition-all hover:border-primary/40 hover:shadow-[0_20px_70px_rgba(158,208,255,0.15)]">
            <div className="flex items-center gap-4 border-b border-base-300 pb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 font-black text-primary text-xl">
                1
              </div>
              <div>
                <h2 className="text-2xl font-bold">Install Ollama</h2>
                <p className="text-base-content/60">The open-source engine for running local LLMs</p>
              </div>
            </div>
            <div className="pt-6">
              <p className="mb-4 text-base-content/80">
                Ollama allows you to run powerful language models directly on your computer without sending data to
                external APIs.
              </p>
              <div className="space-y-4">
                <div className="rounded-xl border border-base-300 bg-base-200 p-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
                    <CpuChipIcon className="w-5 h-5" /> Mac & Linux
                  </h3>
                  <code className="block bg-black/20 p-3 rounded-lg text-sm text-success font-mono">
                    curl -fsSL https://ollama.com/install.sh | sh
                  </code>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-200 p-4">
                  <h3 className="font-semibold text-primary flex items-center gap-2 mb-2">
                    <CpuChipIcon className="w-5 h-5" /> Windows
                  </h3>
                  <p className="text-sm">
                    Download the executable directly from{" "}
                    <a
                      href="https://ollama.com/download/windows"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-primary"
                    >
                      ollama.com/download
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group rounded-3xl border border-primary/15 bg-base-100 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.1)] transition-all hover:border-primary/40 hover:shadow-[0_20px_70px_rgba(158,208,255,0.15)]">
            <div className="flex items-center gap-4 border-b border-base-300 pb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 font-black text-primary text-xl">
                2
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pull a Model</h2>
                <p className="text-base-content/60">Download the AI model to process prompts</p>
              </div>
            </div>
            <div className="pt-6">
              <p className="mb-4 text-base-content/80">
                We recommend starting with `llama3` for a great balance of speed and quality. Make sure Ollama is
                running in the background, then open your terminal:
              </p>
              <div className="rounded-xl border border-base-300 bg-base-200 p-4">
                <code className="block bg-black/20 p-3 rounded-lg text-sm text-success font-mono">
                  ollama run llama3
                </code>
              </div>
              <p className="mt-4 text-sm text-base-content/60">
                Once the model is downloaded and running, your local API will be active at{" "}
                <code className="bg-base-300 px-1 rounded">http://localhost:11434</code>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group rounded-3xl border border-primary/15 bg-base-100 p-8 shadow-[0_20px_70px_rgba(0,0,0,0.1)] transition-all hover:border-primary/40 hover:shadow-[0_20px_70px_rgba(158,208,255,0.15)]">
            <div className="flex items-center gap-4 border-b border-base-300 pb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 font-black text-primary text-xl">
                3
              </div>
              <div>
                <h2 className="text-2xl font-bold">Connect to Monad</h2>
                <p className="text-base-content/60">Start the Middleman Server</p>
              </div>
            </div>
            <div className="pt-6">
              <p className="mb-4 text-base-content/80">
                With Ollama running locally, you just need to start our Node.js server script. It will listen to the
                Monad smart contract, automatically place reverse-bids, send won prompts to your local Ollama instance,
                and claim the MON reward.
              </p>

              <div className="space-y-4">
                <div className="rounded-xl border border-base-300 bg-base-200 p-5">
                  <div className="flex items-center gap-2 font-bold mb-3">
                    <CommandLineIcon className="w-5 h-5 text-primary" /> Setup the Server
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-base-content/80">
                    <li>
                      Navigate to <code className="bg-base-300 px-1 rounded">packages/server</code> in your terminal.
                    </li>
                    <li>
                      Ensure your <code className="bg-base-300 px-1 rounded">.env</code> file has your Monad Testnet
                      private key and the contract address.
                    </li>
                    <li>
                      Update your server script to fetch from{" "}
                      <code className="bg-base-300 px-1 rounded">http://localhost:11434/api/generate</code> instead of
                      Gemini.
                    </li>
                    <li>
                      Run <code className="bg-base-300 px-1 text-success rounded font-mono">npm start</code> to activate
                      your node!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-primary/10 px-6 py-4 text-primary">
            <CurrencyDollarIcon className="h-8 w-8" />
            <span className="text-lg font-bold">You are now ready to earn MON automatically while you sleep!</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CreatorPage;
