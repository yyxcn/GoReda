"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <header className="relative overflow-hidden bg-primary min-h-[700px] flex items-center">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src="/shopping.mp4" type="video/mp4" />
          </video>
          <div className="relative z-10 w-full px-6 md:px-16 max-w-[1280px] mx-auto">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold tracking-[0.15em] text-primary-fixed uppercase mb-3 flex items-center gap-2">
                <span className="w-8 h-px bg-primary-fixed" />
                On-Chain Verified Marketplace
              </div>
              <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-6">
                The Art of
                <br />
                Decentralized Provenance.
              </h1>
              <p className="text-lg text-white/70 mb-10 max-w-md leading-relaxed">
                Bridging products with digital integrity through GoReda&apos;s
                escrow protocol. Curated for those who demand absolute
                authenticity.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="/buyer"
                  className="bg-white text-primary px-10 py-4 text-sm font-medium tracking-[0.05em] hover:opacity-90 transition-colors uppercase"
                >
                  View Collection
                </Link>
                <Link
                  href="#how-it-works"
                  className="border border-white/60 text-white px-10 py-4 text-sm font-medium tracking-[0.05em] hover:bg-white/10 transition-colors uppercase"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="py-20 px-6 md:px-16 border-b border-outline-variant/20"
        >
          <div className="max-w-[1280px] mx-auto">
            <p className="text-xs font-semibold tracking-[0.15em] text-secondary uppercase mb-10 text-center">
              How It Works
            </p>
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <p className="font-serif text-5xl text-primary/20 mb-4">01</p>
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-3 text-primary">
                  Escrow Lock
                </h3>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  Buyer selects a bottle and SOL is locked into an on-chain
                  escrow. Funds are safe until delivery is confirmed.
                </p>
              </div>
              <div>
                <p className="font-serif text-5xl text-primary/20 mb-4">02</p>
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-3 text-primary">
                  Validator Verification
                </h3>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  A staked validator node (500+ SOL) receives and authenticates
                  the bottle. Every step is recorded as an on-chain transaction.
                </p>
              </div>
              <div>
                <p className="font-serif text-5xl text-primary/20 mb-4">03</p>
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] mb-3 text-primary">
                  Instant Settlement
                </h3>
                <p className="text-base text-on-surface-variant leading-relaxed">
                  Buyer confirms delivery and escrow is released to seller. Need
                  a refund? One transaction, three seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-6 md:px-16 border-b border-outline-variant/20">
          <div className="max-w-[1280px] mx-auto grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-serif text-4xl text-primary">0.3s</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mt-1">
                Avg Block Time
              </p>
            </div>
            <div>
              <p className="font-serif text-4xl text-primary">500 SOL</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mt-1">
                Min Validator Stake
              </p>
            </div>
            <div>
              <p className="font-serif text-4xl text-primary">1 TX</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mt-1">
                Refund Transaction
              </p>
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-20 px-6 md:px-16 border-b border-outline-variant/20">
          <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-8">
            <div className="border border-error/20 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-error mb-6">
                The Problem
              </p>
              <ul className="space-y-3 text-base text-on-surface-variant">
                <li>Counterfeit products &mdash; no proof of authenticity</li>
                <li>Refunds take up to 7 days through intermediaries</li>
                <li>No verifiable shipping trail for fragile bottles</li>
                <li>Broken cold-chain with zero accountability</li>
              </ul>
            </div>
            <div className="border border-secondary/20 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-secondary mb-6">
                GoReda&apos;s Solution
              </p>
              <ul className="space-y-3 text-base text-on-surface-variant">
                <li>Instant refund in 1 transaction (&lt;3 seconds)</li>
                <li>Automatic escrow settlement via smart contract</li>
                <li>Every step recorded on Solana &mdash; Solscan proof</li>
                <li>Validator nodes authenticate bottles, staked 500+ SOL</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Verification Section */}
        <section className="bg-primary-fixed/30 py-20 px-6 md:px-16 border-y border-outline-variant/20">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center">
            <h2 className="font-serif text-5xl text-primary mb-6">
              On-Chain Trust Engine
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mb-12 leading-relaxed">
              GoReda uses programmable escrow to ensure your products are authentic
              and delivered before funds are released. Commerce, reimagined for
              the digital age.
            </p>
            <div className="flex gap-12 items-center">
              <div className="flex flex-col items-center">
                <span className="font-serif text-6xl text-primary">
                  100%
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-on-surface-variant uppercase">
                  Authentic
                </span>
              </div>
              <div className="w-px h-12 bg-outline-variant" />
              <div className="flex flex-col items-center">
                <span className="font-serif text-6xl text-primary">
                  Instant
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-on-surface-variant uppercase">
                  Verification
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 md:px-16 text-center border-t border-outline-variant/20">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-[0.3em] mb-4">
            Solana Frontier Hackathon Demo &mdash; Devnet
          </p>
          <p className="text-base text-on-surface-variant mb-8 max-w-md mx-auto">
            Traditional refunds take 3 days. We do it in 3 seconds.
          </p>
          <Link
            href="/buyer"
            className="inline-block px-10 py-4 bg-primary text-on-primary text-sm font-medium uppercase tracking-[0.05em] hover:opacity-80 transition"
          >
            Try the Demo
          </Link>
        </section>

        {/* Footer */}
        <footer className="bg-surface-container-low border-t border-outline-variant/20">
          <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
              <span className="font-serif text-[32px] text-primary">
                GoReda
              </span>
              <p className="text-sm text-on-surface-variant/60 italic">
                Artisanal Decentralized Commerce.
              </p>
            </div>
            <div className="flex gap-6 text-xs font-semibold tracking-[0.15em] text-on-surface-variant/60 uppercase">
              <span>Documentation</span>
              <span>Legal</span>
              <span>Privacy</span>
            </div>
            <p className="text-[10px] text-on-surface-variant/40">
              &copy; 2025 GoReda Protocol.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
