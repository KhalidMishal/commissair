import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon, SparklesIcon, UserCircleIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <main className="min-h-screen bg-base-200">
      <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-base-200">
        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-5 py-16">
          <div className="max-w-2xl text-base-content">
            <div className="hero-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_32px_rgba(65,156,255,0.12)] backdrop-blur">
              <SparklesIcon className="h-5 w-5" />
              Commissair
            </div>
            <h1 className="hero-reveal hero-reveal-delay-1 text-5xl font-black leading-tight text-primary md:text-7xl">
              Decentralized AI work, fulfilled by real providers.
            </h1>
            <p className="hero-reveal hero-reveal-delay-2 mt-6 max-w-xl text-lg leading-8 text-base-content/85">
              Post an AI task, escrow MON, and let independent GPU providers compete to deliver research, text, images,
              code, or files through a simple chat-style experience.
            </p>
            <div className="hero-reveal hero-reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="#choose-role"
                className="btn btn-primary btn-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_38px_rgba(158,208,255,0.22)]"
              >
                Get started
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="choose-role"
        className="relative flex min-h-[calc(100vh-6rem)] scroll-mt-24 items-center border-t border-primary/10 bg-base-100"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <SparklesIcon className="h-5 w-5" />
              Choose your path
            </div>
            <h2 className="mt-6 text-4xl font-black leading-tight text-primary md:text-6xl">
              Start as a customer or bring your compute as a creator.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-base-content/75">
              Customers post commissions and escrow MON. Creators compete to fulfill work through provider nodes.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              href="/create"
              className="group rounded-box border border-primary/15 bg-base-200 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-base-300"
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <UserCircleIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-3xl font-black text-primary">I am a customer</h3>
                  <p className="mt-3 text-base-content/70">
                    Create a commission, set a budget, and receive AI deliverables from competing providers.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-semibold text-primary">
                  Create a commission
                  <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/creator"
              className="group rounded-box border border-primary/15 bg-base-200 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-base-300"
            >
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <WrenchScrewdriverIcon className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-3xl font-black text-primary">I am a creator</h3>
                  <p className="mt-3 text-base-content/70">
                    Review how provider nodes bid, generate results, and receive payment after delivery.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-semibold text-primary">
                  View provider flow
                  <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 border-t border-base-300 bg-base-100">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 md:grid-cols-3">
          <div>
            <div className="text-sm font-semibold text-primary">01</div>
            <h2 className="mt-1 font-bold">Create a commission</h2>
            <p className="mt-2 text-sm text-base-content/65">
              Describe what you need and set the amount you are willing to escrow.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">02</div>
            <h2 className="mt-1 font-bold">Providers compete</h2>
            <p className="mt-2 text-sm text-base-content/65">
              Available nodes bid in the background while the interface stays simple.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-primary">03</div>
            <h2 className="mt-1 font-bold">Receive the result</h2>
            <p className="mt-2 text-sm text-base-content/65">
              The winning provider returns the output and receives payment automatically.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
