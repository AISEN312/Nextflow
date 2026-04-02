import type { Node, Edge } from "@xyflow/react";

// Node data types
export type NodeType =
  | "textNode"
  | "uploadImageNode"
  | "uploadVideoNode"
  | "llmNode"
  | "cropImageNode"
  | "extractFrameNode";

export type HandleDataType = "text" | "image" | "video" | "any";

export interface HandleDefinition {
  id: string;
  label: string;
  dataType: HandleDataType;
  position: "left" | "right";
}

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  type: NodeType;
  isRunning?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  output?: string;
}

export interface TextNodeData extends BaseNodeData {
  type: "textNode";
  text: string;
}

export interface UploadImageNodeData extends BaseNodeData {
  type: "uploadImageNode";
  imageUrl: string;
  fileName: string;
}

export interface UploadVideoNodeData extends BaseNodeData {
  type: "uploadVideoNode";
  videoUrl: string;
  fileName: string;
}

export interface LLMNodeData extends BaseNodeData {
  type: "llmNode";
  model: string;
  systemPrompt: string;
  userMessage: string;
  imageUrls: string[];
  result: string;
  connectedInputs: {
    system_prompt: boolean;
    user_message: boolean;
    images: boolean;
  };
}

export interface CropImageNodeData extends BaseNodeData {
  type: "cropImageNode";
  imageUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  result: string;
  connectedInputs: {
    image_url: boolean;
    x_percent: boolean;
    y_percent: boolean;
    width_percent: boolean;
    height_percent: boolean;
  };
}

export interface ExtractFrameNodeData extends BaseNodeData {
  type: "extractFrameNode";
  videoUrl: string;
  timestamp: string;
  result: string;
  connectedInputs: {
    video_url: boolean;
    timestamp: boolean;
  };
}

export type WorkflowNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

// Node result for execution history
export interface NodeResult {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  status: "success" | "failed" | "running" | "pending";
  output?: string;
  error?: string;
  duration?: number;
  inputs?: Record<string, unknown>;
}

// Workflow run
export interface WorkflowRunEntry {
  id: string;
  workflowId: string;
  status: "running" | "success" | "failed" | "partial";
  scope: "full" | "partial" | "single";
  duration?: number;
  startedAt: string;
  completedAt?: string;
  nodeResults: NodeResult[];
  nodeCount?: number;
}

// Connection validation
export const HANDLE_TYPE_MAP: Record<
  NodeType,
  { inputs: HandleDefinition[]; outputs: HandleDefinition[] }
> = {
  textNode: {
    inputs: [],
    outputs: [{ id: "output", label: "Text", dataType: "text", position: "right" }],
  },
  uploadImageNode: {
    inputs: [],
    outputs: [{ id: "output", label: "Image", dataType: "image", position: "right" }],
  },
  uploadVideoNode: {
    inputs: [],
    outputs: [{ id: "output", label: "Video", dataType: "video", position: "right" }],
  },
  llmNode: {
    inputs: [
      { id: "system_prompt", label: "System Prompt", dataType: "text", position: "left" },
      { id: "user_message", label: "User Message", dataType: "text", position: "left" },
      { id: "images", label: "Images", dataType: "image", position: "left" },
    ],
    outputs: [{ id: "output", label: "Response", dataType: "text", position: "right" }],
  },
  cropImageNode: {
    inputs: [
      { id: "image_url", label: "Image", dataType: "image", position: "left" },
      { id: "x_percent", label: "X %", dataType: "text", position: "left" },
      { id: "y_percent", label: "Y %", dataType: "text", position: "left" },
      { id: "width_percent", label: "Width %", dataType: "text", position: "left" },
      { id: "height_percent", label: "Height %", dataType: "text", position: "left" },
    ],
    outputs: [{ id: "output", label: "Cropped Image", dataType: "image", position: "right" }],
  },
  extractFrameNode: {
    inputs: [
      { id: "video_url", label: "Video", dataType: "video", position: "left" },
      { id: "timestamp", label: "Timestamp", dataType: "text", position: "left" },
    ],
    outputs: [{ id: "output", label: "Frame", dataType: "image", position: "right" }],
  },
};

// Check if a connection between two handle types is valid
export function isValidConnection(
  sourceType: HandleDataType,
  targetType: HandleDataType
): boolean {
  if (targetType === "any") return true;
  if (sourceType === "any") return true;
  return sourceType === targetType;
}

// Workflow export/import format
export interface WorkflowExport {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: string;
}
