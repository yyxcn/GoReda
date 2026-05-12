"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { formatDistance } from "@/lib/constants";
import { useValidators } from "@/lib/ValidatorContext";

// ---------------------------------------------------------------------------
// Verify Business — UI-only validator node registration page
// ---------------------------------------------------------------------------
export default function VerifyBusinessPage() {
  const { publicKey } = useWallet();
  const { validators, addValidator } = useValidators();
  const [nodeName, setNodeName] = useState("");
  const [stakeAmount, setStakeAmount] = useState("500");
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleRegister = () => {
    if (!publicKey || !nodeName || Number(stakeAmount) < 500) return;
    const newNode = {
      id: validators.length + 1,
      name: nodeName,
      address: publicKey.toBase58(),
      distance: 100, // 0.1 km
      stake: Number(stakeAmount),
      uptime: 100.0,
      location: location || "Unknown",
    };
    addValidator(newNode);
    setSubmitted(true);
  };

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-10 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto">
            <span className="text-xs font-semibold tracking-[0.15em] text-secondary uppercase block mb-1">
              Validate
            </span>
            <h1 className="font-serif text-4xl text-primary">
              Start Business
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
              Register as a validator node to verify product authenticity and
              earn fees from every transaction you process.
            </p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10">
          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                step: "01",
                title: "Stake SOL",
                desc: "Stake a minimum of 500 SOL to register your node. Your stake acts as collateral — if you approve a counterfeit product, your stake gets slashed.",
              },
              {
                step: "02",
                title: "Receive Shipments",
                desc: "Sellers ship products to your physical location for inspection. You verify authenticity, condition, and packaging before forwarding to the buyer.",
              },
              {
                step: "03",
                title: "Earn Fees",
                desc: "Collect a verification fee for every order you process. Higher stake and uptime means more sellers will route orders through your node.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="border border-outline-variant/30 bg-white p-6"
              >
                <span className="text-[10px] font-bold text-secondary tracking-[0.2em]">
                  STEP {item.step}
                </span>
                <h3 className="font-serif text-xl text-primary mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Registration form */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-6">
                Register Your Node
              </h2>

              {!publicKey ? (
                <div className="border border-outline-variant/30 bg-white p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary-fixed/30 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                  </div>
                  <p className="font-serif text-lg text-primary mb-2">
                    Connect Your Wallet
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Connect a wallet to register as a validator node.
                  </p>
                </div>
              ) : submitted ? (
                <div className="border border-secondary/30 bg-secondary/5 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <p className="font-serif text-xl text-primary mb-2">
                    Registration Submitted
                  </p>
                  <p className="text-xs text-on-surface-variant mb-4 max-w-sm mx-auto">
                    Your validator node registration is pending review. Once
                    approved, you will start receiving shipment requests from
                    sellers in your area.
                  </p>
                  <div className="space-y-1 text-xs text-left max-w-xs mx-auto">
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Node Name</span>
                      <span className="text-primary font-semibold">
                        {nodeName || "Unnamed"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Stake</span>
                      <span className="text-secondary font-bold">
                        {stakeAmount} SOL
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Location</span>
                      <span className="text-primary font-semibold">
                        {location || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-on-surface-variant">Wallet</span>
                      <span className="text-primary font-mono">
                        {publicKey.toBase58().slice(0, 4)}...
                        {publicKey.toBase58().slice(-4)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 px-6 py-2.5 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition"
                  >
                    Edit Registration
                  </button>
                </div>
              ) : (
                <div className="border border-outline-variant/30 bg-white p-6 space-y-5">
                  {/* Node name */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-2">
                      Node Name
                    </label>
                    <input
                      type="text"
                      value={nodeName}
                      onChange={(e) => setNodeName(e.target.value)}
                      placeholder="e.g. SeoulNode-Premium"
                      className="w-full px-4 py-3 border border-outline-variant/40 text-sm text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  {/* Stake amount */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-2">
                      Stake Amount (SOL)
                    </label>
                    <input
                      type="number"
                      min="500"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-outline-variant/40 text-sm text-primary focus:outline-none focus:border-primary transition"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1.5">
                      Minimum 500 SOL required. Higher stakes attract more
                      sellers.
                    </p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-2">
                      Physical Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Seoul, Gangnam-gu"
                      className="w-full px-4 py-3 border border-outline-variant/40 text-sm text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary transition"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1.5">
                      Products will be shipped to this address for verification.
                    </p>
                  </div>

                  {/* Wallet */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-2">
                      Wallet Address
                    </label>
                    <div className="px-4 py-3 border border-outline-variant/20 bg-surface-container/30 text-xs font-mono text-on-surface-variant">
                      {publicKey.toBase58()}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleRegister}
                    disabled={!nodeName || Number(stakeAmount) < 500}
                    className="w-full py-3.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Register Validator Node — Stake {stakeAmount} SOL
                  </button>

                  <p className="text-[10px] text-on-surface-variant text-center leading-relaxed">
                    By registering, you agree to the slashing conditions. If a
                    product you approve is found to be counterfeit, your stake
                    will be partially or fully slashed.
                  </p>
                </div>
              )}
            </div>

            {/* Active validators */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-6">
                Active Validator Nodes ({validators.length})
              </h2>

              <div className="space-y-3">
                {validators.map((v) => (
                  <div
                    key={v.id}
                    className="border border-outline-variant/30 bg-white p-4 flex items-center gap-4"
                  >
                    {/* Status dot */}
                    <div className="shrink-0">
                      <div className="w-2.5 h-2.5 bg-secondary rounded-full ring-4 ring-secondary/10" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-primary truncate">
                          {v.name}
                        </p>
                        <span className="text-[9px] px-1.5 py-0.5 bg-secondary/10 text-secondary font-bold uppercase tracking-wider shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant">
                        {v.location}
                      </p>
                      <p className="text-[10px] font-mono text-outline mt-0.5 truncate">
                        {v.address.slice(0, 8)}...{v.address.slice(-4)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="shrink-0 text-right space-y-0.5">
                      <p className="text-xs text-secondary font-bold">
                        {v.stake.toLocaleString()} SOL
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {formatDistance(v.distance)} away
                      </p>
                      <p className="text-[10px] text-on-surface-variant">
                        {v.uptime}% uptime
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Network stats */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="border border-outline-variant/30 bg-white p-4 text-center">
                  <p className="font-serif text-2xl text-primary">
                    {validators.length}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                    Active Nodes
                  </p>
                </div>
                <div className="border border-outline-variant/30 bg-white p-4 text-center">
                  <p className="font-serif text-2xl text-secondary">
                    {validators.reduce((a, v) => a + v.stake, 0).toLocaleString()}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                    Total Staked (SOL)
                  </p>
                </div>
                <div className="border border-outline-variant/30 bg-white p-4 text-center">
                  <p className="font-serif text-2xl text-primary">
                    {(
                      validators.reduce((a, v) => a + v.uptime, 0) /
                      validators.length
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                    Avg Uptime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
