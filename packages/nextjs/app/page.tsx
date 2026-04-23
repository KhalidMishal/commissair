import Link from "next/link";
import type { NextPage } from "next";
import {
  ArrowRightIcon,
  BoltIcon,
  CodeBracketIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <main className="min-h-screen bg-base-200 selection:bg-primary/30 selection:text-primary relative overflow-hidden">
      {/* GLOWING BACKGROUND ORBS */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/30 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>

      <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden z-10">
        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl items-center px-5 py-16">
          <div className="max-w-3xl text-base-content relative z-20">
            <div className="hero-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary shadow-[0_0_40px_rgba(65,156,255,0.2)] backdrop-blur-md">
              <SparklesIcon className="h-5 w-5 animate-pulse-fast" />
              The Future of Compute is Commissair
            </div>

            <h1 className="hero-reveal hero-reveal-delay-1 text-6xl font-black leading-[1.12] text-primary md:text-8xl">
              Decentralized AI.
              <br /> Fulfilled by Reality.
            </h1>

            <p className="hero-reveal hero-reveal-delay-2 mt-8 max-w-2xl text-xl leading-relaxed text-base-content/80 font-medium">
              Post an AI task, escrow MON, and watch independent GPU providers compete to deliver research, text,
              images, code, or files through a seamless, invisible reverse-auction.
            </p>

            <div className="hero-reveal hero-reveal-delay-3 mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#choose-role"
                className="btn btn-primary border-none bg-gradient-to-r from-primary to-secondary text-primary-content font-bold px-8 py-4 h-auto text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(65,156,255,0.5)] rounded-full"
              >
                Enter the Market
                <ArrowRightIcon className="h-5 w-5 ml-1" />
              </Link>
              <a
                href="https://github.com/khalidmishal/commissair"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost border border-primary/20 hover:bg-primary/10 hover:border-primary/50 text-base-content font-bold px-8 py-4 h-auto text-lg rounded-full backdrop-blur-sm transition-all duration-300"
              >
                <CodeBracketIcon className="h-5 w-5 mr-1" />
                View GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="choose-role"
        className="relative flex min-h-[calc(100vh-6rem)] scroll-mt-24 items-center border-t border-primary/10 bg-base-100/50 backdrop-blur-xl z-20"
      >
        {/* Additional Glow for section 2 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-primary/5 rounded-full filter blur-[150px] -z-10 pointer-events-none"></div>

        <div className="mx-auto w-full max-w-6xl px-5 py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black leading-tight text-white md:text-6xl drop-shadow-md">
              Choose your path
            </h2>
            <p className="mt-5 text-xl text-base-content/70 font-medium">
              Customers fund the network. Creators power the network.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Customer Card */}
            <Link
              href="/create"
              className="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-base-200/60 p-10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_20px_80px_rgba(158,208,255,0.25)] animate-float"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_rgba(65,156,255,0.2)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <UserCircleIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-8 text-4xl font-black text-white group-hover:text-primary transition-colors duration-300">
                    I am a customer
                  </h3>
                  <p className="mt-4 text-lg text-base-content/80 leading-relaxed">
                    Create an instant AI commission, set a MON budget, and receive high-quality deliverables from
                    competing decentralized providers.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-bold text-primary text-lg mt-4">
                  Launch a query
                  <ArrowRightIcon className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </div>
            </Link>

            {/* Creator Card */}
            <Link
              href="/creator"
              className="group relative overflow-hidden rounded-[2rem] border border-secondary/20 bg-base-200/60 p-10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500 hover:-translate-y-2 hover:border-secondary/60 hover:shadow-[0_20px_80px_rgba(61,126,193,0.25)] animate-float animation-delay-2000"
            >
              <div className="absolute inset-0 bg-gradient-to-bl from-secondary/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-secondary/30 bg-secondary/10 text-secondary shadow-[0_0_20px_rgba(61,126,193,0.2)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                    <WrenchScrewdriverIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-8 text-4xl font-black text-white group-hover:text-secondary transition-colors duration-300">
                    I am a creator
                  </h3>
                  <p className="mt-4 text-lg text-base-content/80 leading-relaxed">
                    Connect your local GPU using Ollama and our Middleman Server. Automatically bid on tasks and earn
                    MON while you sleep.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-bold text-secondary text-lg mt-4">
                  Setup Provider Node
                  <ArrowRightIcon className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Visualized Workflow Section */}
      <section
        id="workflow"
        className="relative border-t border-primary/20 bg-base-300/40 backdrop-blur-2xl z-20 py-24 overflow-hidden"
      >
        <div className="mx-auto max-w-6xl px-5 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-white md:text-5xl">How the Network Works</h2>
          </div>

          <div className="relative pt-2">
            {/* Connecting Line */}
            <div className="absolute left-0 top-[42px] hidden h-0.5 w-full bg-gradient-to-r from-primary/20 via-primary/70 to-primary/20 md:block"></div>

            <div className="grid gap-14 md:grid-cols-3 relative z-10">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-base-100 border-4 border-primary grid place-items-center mb-9 shadow-[0_0_30px_rgba(65,156,255,0.4)] transition-transform duration-500 group-hover:scale-110">
                  <UserCircleIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">1. Commission</h3>
                <p className="text-base-content/70 font-medium px-4">
                  Customer posts a request and locks MON into the secure smart contract escrow.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-base-100 border-4 border-accent grid place-items-center mb-9 shadow-[0_0_30px_rgba(111,182,255,0.4)] transition-transform duration-500 group-hover:scale-110">
                  <BoltIcon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">2. Auction</h3>
                <p className="text-base-content/70 font-medium px-4">
                  Provider Nodes instantly detect the prompt and submit competitive reverse-bids.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-base-100 border-4 border-success grid place-items-center mb-9 shadow-[0_0_30px_rgba(101,231,194,0.4)] transition-transform duration-500 group-hover:scale-110">
                  <CurrencyDollarIcon className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">3. Delivery</h3>
                <p className="text-base-content/70 font-medium px-4">
                  The winning node processes the AI task, submits the result, and gets paid!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
