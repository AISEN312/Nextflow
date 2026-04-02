"use client";

import React, { useCallback, useState } from "react";
import { useWorkflowStore } from "@/store/workflow-store";
import {
  Play,
  Save,
  Download,
  Upload,
  Undo2,
  Redo2,
  Loader2,
  PlayCircle,
  FileText,
} from "lucide-react";
import type { WorkflowExport, WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { cn } from "@/lib/utils";
import { getSampleWorkflow } from "@/lib/sample-workflow";

export function Toolbar() {
  const {
    workflowName,
    setWorkflowName,
    nodes,
    edges,
    viewport,
    workflowId,
    selectedNodeIds,
    undo,
    redo,
    history,
    historyIndex,
    setNodes,
    setEdges,
    pushHistory,
  } = useWorkflowStore();

  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Save workflow
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: workflowId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: workflowName,
          nodes,
          edges,
          viewport,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        useWorkflowStore.getState().setWorkflowId(data.id);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  }, [workflowId, workflowName, nodes, edges, viewport]);

  // Export as JSON
  const handleExport = useCallback(() => {
    const exportData: WorkflowExport = {
      name: workflowName,
      nodes,
      edges,
      version: "1.0.0",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workflowName, nodes, edges]);

  // Import from JSON
  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as WorkflowExport;
        setNodes(data.nodes as WorkflowNode[]);
        setEdges(data.edges as WorkflowEdge[]);
        setWorkflowName(data.name);
        pushHistory();
      } catch {
        alert("Invalid workflow file");
      }
    };
    input.click();
  }, [setNodes, setEdges, setWorkflowName, pushHistory]);

  // Execute workflow
  const handleExecute = useCallback(
    async (mode: "full" | "selected" | "single") => {
      setExecuting(true);
      try {
        let nodeIds: string[] | undefined;
        if (mode === "selected") {
          nodeIds = Array.from(selectedNodeIds);
        } else if (mode === "single") {
          nodeIds = Array.from(selectedNodeIds).slice(0, 1);
        }

        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId,
            nodes,
            edges,
            nodeIds,
            mode,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          // Update nodes with results
          if (result.nodeResults) {
            for (const nr of result.nodeResults) {
              if (nr.output) {
                useWorkflowStore.getState().setNodeOutput(nr.nodeId, nr.output);
              }
              if (nr.error) {
                useWorkflowStore.getState().setNodeError(nr.nodeId, nr.error);
              }
            }
          }
          // Add run to history
          if (result.run) {
            useWorkflowStore.getState().addRun(result.run);
          }
        }
      } catch (err) {
        console.error("Execution failed:", err);
      }
      setExecuting(false);
    },
    [workflowId, nodes, edges, selectedNodeIds]
  );

  return (
    <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4">
      {/* Left: Workflow name */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="bg-transparent border-none text-sm font-semibold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-2 py-1 max-w-48"
        />
      </div>

      {/* Center: Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Run buttons */}
        <button
          onClick={() => handleExecute("full")}
          disabled={executing || nodes.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            "bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          )}
          title="Run entire workflow"
        >
          {executing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run All
        </button>

        {selectedNodeIds.size > 0 && (
          <button
            onClick={() =>
              handleExecute(selectedNodeIds.size === 1 ? "single" : "selected")
            }
            disabled={executing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors disabled:opacity-50"
            title={
              selectedNodeIds.size === 1
                ? "Run selected node"
                : "Run selected nodes"
            }
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Run {selectedNodeIds.size === 1 ? "Node" : `${selectedNodeIds.size} Nodes`}
          </button>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-zinc-800" />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
          title="Save workflow"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
          title="Export as JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Import */}
        <button
          onClick={handleImport}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 transition-colors"
          title="Import from JSON"
        >
          <Upload className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-zinc-800" />

        {/* Load Sample Workflow */}
        <button
          onClick={() => {
            const sample = getSampleWorkflow();
            setNodes(sample.nodes as WorkflowNode[]);
            setEdges(sample.edges as WorkflowEdge[]);
            setWorkflowName("Product Marketing Kit Generator");
            pushHistory();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title="Load sample workflow"
        >
          <FileText className="w-3.5 h-3.5" />
          Sample
        </button>
      </div>
    </div>
  );
}
