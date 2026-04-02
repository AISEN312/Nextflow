"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { LLMNodeData } from "@/types/workflow";
import { Brain, Loader2 } from "lucide-react";

const GEMINI_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

export function LLMNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as LLMNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { model: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleSystemPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { systemPrompt: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleUserMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { userMessage: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <NodeWrapper
      label="Run Any LLM"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-purple-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs text-zinc-400">LLM Execution</span>
      </div>

      {/* Model Selector */}
      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Model</label>
        <select
          value={nodeData.model}
          onChange={handleModelChange}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* System Prompt Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">System Prompt</label>
        <Handle
          type="target"
          position={Position.Left}
          id="system_prompt"
          className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-800 !-left-[22px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <textarea
          value={nodeData.systemPrompt}
          onChange={handleSystemPromptChange}
          placeholder={
            nodeData.connectedInputs?.system_prompt
              ? "← Connected"
              : "Optional system instructions..."
          }
          disabled={nodeData.connectedInputs?.system_prompt}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
        />
      </div>

      {/* User Message Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">User Message</label>
        <Handle
          type="target"
          position={Position.Left}
          id="user_message"
          className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-800 !-left-[22px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <textarea
          value={nodeData.userMessage}
          onChange={handleUserMessageChange}
          placeholder={
            nodeData.connectedInputs?.user_message
              ? "← Connected"
              : "Enter user message..."
          }
          disabled={nodeData.connectedInputs?.user_message}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
        />
      </div>

      {/* Images Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">Images (optional, multi)</label>
        <Handle
          type="target"
          position={Position.Left}
          id="images"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-zinc-800 !-left-[22px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <div className="text-xs text-zinc-600 px-2 py-1 bg-zinc-800/50 rounded">
          {nodeData.connectedInputs?.images
            ? "← Images connected"
            : "Connect image nodes"}
        </div>
      </div>

      {/* Running state */}
      {nodeData.isRunning && (
        <div className="flex items-center gap-2 text-xs text-purple-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing...
        </div>
      )}

      {/* Error display */}
      {nodeData.hasError && nodeData.errorMessage && (
        <div className="p-2 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 break-words">
          {nodeData.errorMessage}
        </div>
      )}

      {/* Result display (inline on the node) */}
      {nodeData.result && !nodeData.isRunning && (
        <div className="p-2 bg-purple-950/30 border border-purple-800/50 rounded text-xs text-zinc-200 break-words max-h-48 overflow-y-auto">
          <div className="text-purple-400 text-xs mb-1 font-medium">Result:</div>
          {nodeData.result}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
