"use client";

import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  BackgroundVariant,
  type OnSelectionChangeFunc,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/store/workflow-store";
import {
  TextNode,
  UploadImageNode,
  UploadVideoNode,
  LLMNode,
  CropImageNode,
  ExtractFrameNode,
} from "@/components/nodes";
import type { NodeType } from "@/types/workflow";

const nodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
};

export function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeIds,
    deleteSelectedNodes,
    setViewport,
  } = useWorkflowStore();

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes }) => {
      setSelectedNodeIds(new Set(selectedNodes.map((n) => n.id)));
    },
    [setSelectedNodeIds]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        // Only delete if not focused on an input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
          return;
        }
        deleteSelectedNodes();
      }
      // Undo/Redo
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          useWorkflowStore.getState().redo();
        } else {
          useWorkflowStore.getState().undo();
        }
      }
    },
    [deleteSelectedNodes]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow") as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [addNode, screenToFlowPosition]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => onConnect(params)}
        onSelectionChange={handleSelectionChange}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 2 },
        }}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={null}
        className="bg-zinc-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#27272a"
        />
        <MiniMap
          nodeColor="#a855f7"
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-zinc-900 !border-zinc-700"
          position="bottom-right"
        />
        <Controls
          className="!bg-zinc-800 !border-zinc-700 !rounded-lg [&>button]:!bg-zinc-800 [&>button]:!border-zinc-700 [&>button]:!text-zinc-400 [&>button:hover]:!bg-zinc-700"
          position="bottom-left"
        />
      </ReactFlow>
    </div>
  );
}
