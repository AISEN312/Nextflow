"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { ExtractFrameNodeData } from "@/types/workflow";
import { Film, Loader2 } from "lucide-react";

export function ExtractFrameNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as ExtractFrameNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleTimestampChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { timestamp: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <NodeWrapper
      label="Extract Frame"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-cyan-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Film className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs text-zinc-400">FFmpeg Frame Extract</span>
      </div>

      {/* Video Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">Video</label>
        <Handle
          type="target"
          position={Position.Left}
          id="video_url"
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-zinc-800 !-left-[22px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <div className="text-xs text-zinc-600 px-2 py-1 bg-zinc-800/50 rounded">
          {nodeData.connectedInputs?.video_url
            ? "← Video connected"
            : "Connect video node"}
        </div>
      </div>

      {/* Timestamp Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">Timestamp</label>
        <Handle
          type="target"
          position={Position.Left}
          id="timestamp"
          className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-zinc-800 !-left-[20px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <input
          type="text"
          value={nodeData.timestamp}
          onChange={handleTimestampChange}
          placeholder={
            nodeData.connectedInputs?.timestamp
              ? "← Connected"
              : 'e.g. 5 or 50%'
          }
          disabled={nodeData.connectedInputs?.timestamp}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-xs text-zinc-600">Seconds or percentage (e.g. &quot;50%&quot;)</span>
      </div>

      {nodeData.isRunning && (
        <div className="flex items-center gap-2 text-xs text-cyan-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Extracting frame...
        </div>
      )}

      {nodeData.hasError && nodeData.errorMessage && (
        <div className="p-2 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 break-words">
          {nodeData.errorMessage}
        </div>
      )}

      {nodeData.result && !nodeData.isRunning && (
        <div className="space-y-1">
          <div className="text-cyan-400 text-xs font-medium">Extracted Frame:</div>
          <img
            src={nodeData.result}
            alt="Extracted frame"
            className="w-full h-24 object-cover rounded border border-zinc-700"
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
