"use client";

import React, { useState, useCallback } from "react";
import { useWorkflowStore } from "@/store/workflow-store";
import type { NodeType } from "@/types/workflow";
import {
  Type,
  ImageIcon,
  Video,
  Brain,
  Crop,
  Film,
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeButtonConfig {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const NODE_BUTTONS: NodeButtonConfig[] = [
  {
    type: "textNode",
    label: "Text",
    icon: <Type className="w-4 h-4" />,
    color: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
    description: "Simple text input",
  },
  {
    type: "uploadImageNode",
    label: "Upload Image",
    icon: <ImageIcon className="w-4 h-4" />,
    color: "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    description: "Upload image file",
  },
  {
    type: "uploadVideoNode",
    label: "Upload Video",
    icon: <Video className="w-4 h-4" />,
    color: "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20",
    description: "Upload video file",
  },
  {
    type: "llmNode",
    label: "Run Any LLM",
    icon: <Brain className="w-4 h-4" />,
    color: "text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
    description: "Execute LLM model",
  },
  {
    type: "cropImageNode",
    label: "Crop Image",
    icon: <Crop className="w-4 h-4" />,
    color: "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20",
    description: "Crop image with FFmpeg",
  },
  {
    type: "extractFrameNode",
    label: "Extract Frame",
    icon: <Film className="w-4 h-4" />,
    color: "text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20",
    description: "Extract frame from video",
  },
];

export function LeftSidebar() {
  const { leftSidebarOpen, toggleLeftSidebar, addNode } = useWorkflowStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredButtons = NODE_BUTTONS.filter(
    (btn) =>
      btn.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      btn.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNode = useCallback(
    (type: NodeType) => {
      // Add node at a random position near the center of the canvas
      const x = 300 + Math.random() * 200;
      const y = 200 + Math.random() * 200;
      addNode(type, { x, y });
    },
    [addNode]
  );

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: NodeType) => {
      event.dataTransfer.setData("application/reactflow", nodeType);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <div
      className={cn(
        "h-full bg-zinc-950 border-r border-zinc-800 flex flex-col transition-all duration-300 relative",
        leftSidebarOpen ? "w-64" : "w-12"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleLeftSidebar}
        className="absolute -right-3 top-4 z-10 w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
      >
        {leftSidebarOpen ? (
          <ChevronLeft className="w-3 h-3 text-zinc-400" />
        ) : (
          <ChevronRight className="w-3 h-3 text-zinc-400" />
        )}
      </button>

      {leftSidebarOpen ? (
        <>
          {/* Header */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Nodes</h2>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Quick Access */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Quick Access
            </h3>
            <div className="space-y-2">
              {filteredButtons.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => handleAddNode(btn.type)}
                  draggable
                  onDragStart={(e) => onDragStart(e, btn.type)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
                    btn.color
                  )}
                >
                  {btn.icon}
                  <div className="text-left">
                    <div className="text-xs font-medium">{btn.label}</div>
                    <div className="text-xs opacity-60">{btn.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center pt-12 space-y-3">
          {NODE_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleAddNode(btn.type)}
              draggable
              onDragStart={(e) => onDragStart(e, btn.type)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-grab",
                btn.color
              )}
              title={btn.label}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
