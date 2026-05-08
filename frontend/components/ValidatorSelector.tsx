"use client";

import { useState } from "react";
import {
  VALIDATORS,
  formatDistance,
  type ValidatorNode,
} from "@/lib/constants";

interface ValidatorSelectorProps {
  onSelect: (validator: ValidatorNode) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function ValidatorSelector({
  onSelect,
  onClose,
  isOpen,
}: ValidatorSelectorProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-outline-variant/40 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-serif text-2xl text-primary">
              Select Validator Node
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary text-xl"
            >
              &times;
            </button>
          </div>
          <p className="text-xs font-semibold tracking-[0.15em] text-on-surface-variant uppercase mt-1">
            Choose a staked validator to verify your shipment
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {VALIDATORS.map((v) => {
            const selected = selectedId === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left p-4 border transition-all ${
                  selected
                    ? "border-primary bg-primary-fixed/20"
                    : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif text-lg text-primary">
                    {v.name}
                  </span>
                  <span className="text-secondary font-bold text-sm">
                    {v.stake.toLocaleString()} SOL
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span>{v.location}</span>
                  <span>{formatDistance(v.distance)}</span>
                  <span className="text-secondary font-semibold">
                    {v.uptime}% uptime
                  </span>
                </div>
                <p className="text-[10px] text-outline font-mono mt-1 truncate">
                  {v.address}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant text-sm font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedId) {
                const v = VALIDATORS.find((v) => v.id === selectedId)!;
                onSelect(v);
                onClose();
                setSelectedId(null);
              }
            }}
            disabled={!selectedId}
            className="flex-1 py-3 bg-primary text-on-primary text-sm font-semibold uppercase tracking-[0.15em]
                       disabled:opacity-30 hover:opacity-80 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
