"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { TextNodeData } from "@/types/workflow";
import { Type } from "lucide-react";

export function TextNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as TextNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { text: e.target.value });
    },
    [id, updateNodeData]
  );

  return (
    <NodeWrapper
      label="Text"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-emerald-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs text-zinc-400">Text Input</span>
      </div>
      <textarea
        value={nodeData.text}
        onChange={handleTextChange}
        placeholder="Enter text..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px]"
        rows={3}
      />
      {nodeData.output && (
        <div className="mt-2 p-2 bg-zinc-800/50 rounded text-xs text-zinc-300 break-words max-h-24 overflow-y-auto">
          {nodeData.output}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
