"use client";

import React, { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { CropImageNodeData } from "@/types/workflow";
import { Crop, Loader2 } from "lucide-react";

export function CropImageNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CropImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const handleParamChange = useCallback(
    (field: string, value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        updateNodeData(id, { [field]: numValue });
      }
    },
    [id, updateNodeData]
  );

  const paramFields = [
    { key: "xPercent", handle: "x_percent", label: "X %" },
    { key: "yPercent", handle: "y_percent", label: "Y %" },
    { key: "widthPercent", handle: "width_percent", label: "Width %" },
    { key: "heightPercent", handle: "height_percent", label: "Height %" },
  ] as const;

  return (
    <NodeWrapper
      label="Crop Image"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-orange-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Crop className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs text-zinc-400">FFmpeg Crop</span>
      </div>

      {/* Image Input */}
      <div className="relative space-y-1">
        <label className="text-xs text-zinc-500">Image</label>
        <Handle
          type="target"
          position={Position.Left}
          id="image_url"
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-zinc-800 !-left-[22px]"
          style={{ top: "auto", bottom: "auto" }}
        />
        <div className="text-xs text-zinc-600 px-2 py-1 bg-zinc-800/50 rounded">
          {nodeData.connectedInputs?.image_url
            ? "← Image connected"
            : "Connect image node"}
        </div>
      </div>

      {/* Crop Parameters */}
      {paramFields.map(({ key, handle, label }) => (
        <div key={key} className="relative space-y-1">
          <Handle
            type="target"
            position={Position.Left}
            id={handle}
            className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-zinc-800 !-left-[20px]"
            style={{ top: "auto", bottom: "auto" }}
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 w-16">{label}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={nodeData[key]}
              onChange={(e) => handleParamChange(key, e.target.value)}
              disabled={nodeData.connectedInputs?.[handle as keyof typeof nodeData.connectedInputs]}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      ))}

      {nodeData.isRunning && (
        <div className="flex items-center gap-2 text-xs text-orange-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Cropping...
        </div>
      )}

      {nodeData.hasError && nodeData.errorMessage && (
        <div className="p-2 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 break-words">
          {nodeData.errorMessage}
        </div>
      )}

      {nodeData.result && !nodeData.isRunning && (
        <div className="space-y-1">
          <div className="text-orange-400 text-xs font-medium">Result:</div>
          <img
            src={nodeData.result}
            alt="Cropped"
            className="w-full h-24 object-cover rounded border border-zinc-700"
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
