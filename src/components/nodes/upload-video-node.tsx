"use client";

import React, { useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { NodeWrapper } from "./node-wrapper";
import { useWorkflowStore } from "@/store/workflow-store";
import type { UploadVideoNodeData } from "@/types/workflow";
import { Video, Upload } from "lucide-react";

export function UploadVideoNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as UploadVideoNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid video file (mp4, mov, webm, m4v)");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      updateNodeData(id, {
        videoUrl: previewUrl,
        fileName: file.name,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            updateNodeData(id, { videoUrl: result.url });
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
      label="Upload Video"
      isRunning={nodeData.isRunning}
      hasError={nodeData.hasError}
      selected={selected}
      headerColor="bg-indigo-900/80"
      onDelete={() => deleteNode(id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Video className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-xs text-zinc-400">Video Upload</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp4,.mov,.webm,.m4v"
        onChange={handleFileChange}
        className="hidden"
      />

      {nodeData.videoUrl ? (
        <div className="relative group">
          <video
            src={nodeData.videoUrl}
            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
            controls
            muted
          />
          <div className="absolute top-1 right-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-white bg-zinc-700/80 px-2 py-1 rounded hover:bg-zinc-600"
            >
              Replace
            </button>
          </div>
          <p className="text-xs text-zinc-400 mt-1 truncate">{nodeData.fileName}</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-indigo-500 transition-colors"
        >
          <Upload className="w-5 h-5 text-zinc-500" />
          <span className="text-xs text-zinc-500">Click to upload video</span>
          <span className="text-xs text-zinc-600">mp4, mov, webm, m4v</span>
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-zinc-800"
      />
    </NodeWrapper>
  );
}
