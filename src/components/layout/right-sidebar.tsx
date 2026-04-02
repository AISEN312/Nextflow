"use client";

import React, { useState } from "react";
import { useWorkflowStore } from "@/store/workflow-store";
import type { WorkflowRunEntry, NodeResult } from "@/types/workflow";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatDuration(ms?: number): string {
  if (!ms) return "--";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    case "failed":
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    case "running":
      return <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />;
    case "partial":
      return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-zinc-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    running: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-xs border font-medium capitalize",
        colors[status] || colors.pending
      )}
    >
      {status}
    </span>
  );
}

function ScopeLabel({ scope, nodeCount }: { scope: string; nodeCount?: number }) {
  switch (scope) {
    case "full":
      return <span className="text-xs text-zinc-500">Full Workflow</span>;
    case "single":
      return <span className="text-xs text-zinc-500">Single Node</span>;
    case "partial":
      return (
        <span className="text-xs text-zinc-500">
          {nodeCount || "?"} nodes selected
        </span>
      );
    default:
      return null;
  }
}

function NodeResultRow({ result }: { result: NodeResult }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg">
      <StatusIcon status={result.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-200 truncate">
            {result.nodeLabel}
          </span>
          <span className="text-xs text-zinc-500 ml-2 flex-shrink-0">
            {formatDuration(result.duration ? result.duration * 1000 : undefined)}
          </span>
        </div>
        {result.output && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 break-words">
            Output: {result.output.substring(0, 100)}
            {result.output.length > 100 ? "..." : ""}
          </p>
        )}
        {result.error && (
          <p className="text-xs text-red-400 mt-1 line-clamp-2">
            Error: {result.error}
          </p>
        )}
      </div>
    </div>
  );
}

function RunEntry({ run }: { run: WorkflowRunEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 flex items-start gap-2 hover:bg-zinc-800/50 transition-colors text-left"
      >
        <StatusIcon status={run.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-200">
              Run #{run.id.slice(-4)}
            </span>
            <StatusBadge status={run.status} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500">
              {formatTime(run.startedAt)}
            </span>
            <ScopeLabel scope={run.scope} nodeCount={run.nodeCount} />
          </div>
          {run.duration !== undefined && (
            <span className="text-xs text-zinc-500">
              Duration: {formatDuration(run.duration * 1000)}
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-zinc-800 pt-2">
          {run.nodeResults.map((result, i) => (
            <NodeResultRow key={`${result.nodeId}-${i}`} result={result} />
          ))}
          {run.nodeResults.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-2">
              No node results
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const { rightSidebarOpen, toggleRightSidebar, runs } = useWorkflowStore();

  return (
    <div
      className={cn(
        "h-full bg-zinc-950 border-l border-zinc-800 flex flex-col transition-all duration-300 relative",
        rightSidebarOpen ? "w-80" : "w-12"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleRightSidebar}
        className="absolute -left-3 top-4 z-10 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
      >
        {rightSidebarOpen ? (
          <ChevronRight className="w-3 h-3 text-zinc-400" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-zinc-400" />
        )}
      </button>

      {rightSidebarOpen ? (
        <>
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Workflow History
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {runs.length} run{runs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Run list */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {runs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-600">No workflow runs yet</p>
                  <p className="text-xs text-zinc-700 mt-1">
                    Run a workflow to see history
                  </p>
                </div>
              ) : (
                runs.map((run) => <RunEntry key={run.id} run={run} />)
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-col items-center pt-12">
          <History className="w-4 h-4 text-zinc-500" />
        </div>
      )}
    </div>
  );
}
