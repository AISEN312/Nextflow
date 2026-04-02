"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface NodeWrapperProps {
  children: React.ReactNode;
  label: string;
  isRunning?: boolean;
  hasError?: boolean;
  selected?: boolean;
  className?: string;
  headerColor?: string;
  onDelete?: () => void;
}

export function NodeWrapper({
  children,
  label,
  isRunning,
  hasError,
  selected,
  className,
  headerColor = "bg-zinc-800",
  onDelete,
}: NodeWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-700/50 bg-zinc-900 shadow-xl min-w-[280px] max-w-[320px] overflow-hidden",
        selected && "ring-2 ring-purple-500",
        hasError && "ring-2 ring-red-500",
        isRunning && "node-running",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2",
          headerColor
        )}
      >
        <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wide">
          {label}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-zinc-400 hover:text-red-400 transition-colors text-xs p-0.5"
            title="Delete node"
          >
            ✕
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">{children}</div>

      <style jsx>{`
        .node-running {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 5px rgba(168, 85, 247, 0.3),
              0 0 10px rgba(168, 85, 247, 0.2);
          }
          50% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.6),
              0 0 40px rgba(168, 85, 247, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
