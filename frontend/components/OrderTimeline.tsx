"use client";

import { TIMELINE_STEPS, solscanTxUrl } from "@/lib/constants";

export interface TimelineEvent {
  status: string;
  timestamp: Date;
  txHash?: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  events: TimelineEvent[];
}

export function OrderTimeline({ currentStatus, events }: OrderTimelineProps) {
  const currentIdx = TIMELINE_STEPS.findIndex(
    (s) => s.status === currentStatus
  );
  const isRefunded = currentStatus === "Refunded";

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIdx && !isRefunded;
        const active = idx === currentIdx && !isRefunded;
        const event = events.find((e) => e.status === step.status);

        return (
          <div key={step.status} className="flex gap-4">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${
                  done
                    ? "bg-primary border-primary"
                    : "bg-white border-outline-variant"
                } ${active ? "ring-4 ring-primary/10 scale-110" : ""}`}
              />
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={`w-px flex-1 min-h-[48px] ${
                    done && idx < currentIdx
                      ? "bg-primary"
                      : "bg-outline-variant/40"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1 -mt-0.5">
              <p
                className={`text-sm font-semibold ${
                  done ? "text-primary" : "text-on-surface-variant/40"
                }`}
              >
                {step.label}
              </p>

              {event && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-on-surface-variant/60">
                    {event.timestamp.toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                  {event.txHash && (
                    <a
                      href={solscanTxUrl(event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-secondary hover:text-primary font-mono transition-colors"
                    >
                      tx: {event.txHash.slice(0, 16)}...
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Refund indicator */}
      {isRefunded && (
        <div className="flex gap-4 mt-2">
          <div className="flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-error border-2 border-error ring-4 ring-error/10" />
          </div>
          <div className="-mt-0.5">
            <p className="text-sm font-semibold text-error">Refunded</p>
            <p className="text-xs text-on-surface-variant/60">
              Escrow released back to buyer in 1 transaction
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
