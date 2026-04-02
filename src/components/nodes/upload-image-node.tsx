"use client";

import React, { useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { UploadImageNodeData } from "@/types/workflow";
import { ImageIcon, Upload } from "lucide-react";

export function UploadImageNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as UploadImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (jpg, jpeg, png, webp, gif)");
        return;
      }

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);
      updateNodeData(id, {
        imageUrl: previewUrl,
        fileName: file.name,
      });

      // Upload via API (Transloadit integration)
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "image");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            updateNodeData(id, { imageUrl: result.url });
          }
        }
      } catch {
        // Keep local preview if upload fails
      }
    },
    [id, updateNodeData]
  );

  return (
    <NodeWrapper
      label="Upload Image"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-blue-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs text-zinc-400">Image Upload</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {nodeData.imageUrl ? (
        <div className="relative group">
          <img
            src={nodeData.imageUrl}
            alt={nodeData.fileName}
            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-white bg-zinc-700 px-2 py-1 rounded"
            >
              Replace
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1 truncate">{nodeData.fileName}</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-blue-500 transition-colors"
        >
          <Upload className="w-5 h-5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Click to upload image</span>
          <span className="text-xs text-zinc-600">jpg, png, webp, gif</span>
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
