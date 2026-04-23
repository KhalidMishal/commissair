import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightIcon, SparklesIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <main className="min-h-screen bg-[#050914]">
      <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-[#050914]">
        <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-5 py-16">
          <div className="max-w-2xl text-[#d8ebff]">
            <div className="hero-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-[#8fc7ff]/25 bg-[#8fc7ff]/8 px-4 py-2 text-sm font-semibold text-[#9ed0ff] shadow-[0_0_32px_rgba(65,156,255,0.12)] backdrop-blur">
              <SparklesIcon className="h-5 w-5" />
              Commissair
            </div>
            <h1 className="hero-reveal hero-reveal-delay-1 text-5xl font-black leading-tight text-[#9ed0ff] md:text-7xl">
              Decentralized AI work, fulfilled by real providers.
            </h1>
            <p className="hero-reveal hero-reveal-delay-2 mt-6 max-w-xl text-lg leading-8 text-[#c4e1ff]/85">
              Post an AI task, escrow MON, and let independent GPU providers compete to deliver research, text, images,
              code, or files through a simple chat-style experience.
            </p>
            <div className="hero-reveal hero-reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/create"
                className="btn btn-lg border-[#9ed0ff]/20 bg-[#0d1f3a] text-[#d8ebff] hover:border-[#9ed0ff]/35 hover:bg-[#12315d]"
              >
                Get started
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-base-300 bg-base-100">
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
