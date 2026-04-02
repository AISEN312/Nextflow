import { create } from "zustand";
import {
  type Connection,
  type EdgeChange,
  type NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  type Viewport,
} from "@xyflow/react";
import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  WorkflowRunEntry,
  NodeResult,
  NodeType,
} from "@/types/workflow";
import { HANDLE_TYPE_MAP, isValidConnection } from "@/types/workflow";
import { validateDAG } from "@/lib/dag";
import { v4 as uuidv4 } from "uuid";

interface HistoryEntry {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowState {
  // Workflow metadata
  workflowId: string | null;
  workflowName: string;

  // React Flow state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: Viewport;

  // Selection
  selectedNodeIds: Set<string>;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Workflow runs
  runs: WorkflowRunEntry[];

  // UI state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;

  // Actions
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => boolean;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  setViewport: (viewport: Viewport) => void;
  setSelectedNodeIds: (ids: Set<string>) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Runs
  addRun: (run: WorkflowRunEntry) => void;
  updateRun: (runId: string, updates: Partial<WorkflowRunEntry>) => void;
  setRuns: (runs: WorkflowRunEntry[]) => void;

  // UI
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Node execution state
  setNodeRunning: (nodeId: string, running: boolean) => void;
  setNodeError: (nodeId: string, error: string | null) => void;
  setNodeOutput: (nodeId: string, output: string) => void;

  // Load/Reset
  loadWorkflow: (
    id: string,
    name: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    viewport?: Viewport
  ) => void;
  resetWorkflow: () => void;
}

function getDefaultNodeData(type: NodeType): WorkflowNodeData {
  switch (type) {
    case "textNode":
      return { label: "Text", type: "textNode", text: "" };
    case "uploadImageNode":
      return {
        label: "Upload Image",
        type: "uploadImageNode",
        imageUrl: "",
        fileName: "",
      };
    case "uploadVideoNode":
      return {
        label: "Upload Video",
        type: "uploadVideoNode",
        videoUrl: "",
        fileName: "",
      };
    case "llmNode":
      return {
        label: "Run Any LLM",
        type: "llmNode",
        model: "gemini-2.0-flash",
        systemPrompt: "",
        userMessage: "",
        imageUrls: [],
        result: "",
        connectedInputs: {
          system_prompt: false,
          user_message: false,
          images: false,
        },
      };
    case "cropImageNode":
      return {
        label: "Crop Image",
        type: "cropImageNode",
        imageUrl: "",
        xPercent: 0,
        yPercent: 0,
        widthPercent: 100,
        heightPercent: 100,
        result: "",
        connectedInputs: {
          image_url: false,
          x_percent: false,
          y_percent: false,
          width_percent: false,
          height_percent: false,
        },
      };
    case "extractFrameNode":
      return {
        label: "Extract Frame",
        type: "extractFrameNode",
        videoUrl: "",
        timestamp: "0",
        result: "",
        connectedInputs: {
          video_url: false,
          timestamp: false,
        },
      };
  }
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: null,
  workflowName: "Untitled Workflow",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeIds: new Set(),
  history: [],
  historyIndex: -1,
  runs: [],
  leftSidebarOpen: true,
  rightSidebarOpen: true,

  setWorkflowId: (id) => set({ workflowId: id }),
  setWorkflowName: (name) => set({ workflowName: name }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const state = get();
    const sourceNode = state.nodes.find((n) => n.id === connection.source);
    const targetNode = state.nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode || !connection.sourceHandle || !connection.targetHandle) {
      return false;
    }

    const sourceType = sourceNode.data.type as NodeType;
    const targetType = targetNode.data.type as NodeType;

    const sourceHandleDef = HANDLE_TYPE_MAP[sourceType].outputs.find(
      (h) => h.id === connection.sourceHandle
    );
    const targetHandleDef = HANDLE_TYPE_MAP[targetType].inputs.find(
      (h) => h.id === connection.targetHandle
    );

    if (!sourceHandleDef || !targetHandleDef) return false;
    if (!isValidConnection(sourceHandleDef.dataType, targetHandleDef.dataType)) {
      return false;
    }

    // Check for existing connections to same target handle (except images which supports multiple)
    const existingConnection = state.edges.find(
      (e) =>
        e.target === connection.target &&
        e.targetHandle === connection.targetHandle &&
        connection.targetHandle !== "images"
    );

    const newEdge: WorkflowEdge = {
      id: `e-${uuidv4()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    };

    let newEdges = existingConnection
      ? state.edges.filter((e) => e.id !== existingConnection.id)
      : [...state.edges];
    newEdges = [...newEdges, newEdge];

    // Check DAG validity
    if (!validateDAG(state.nodes, newEdges)) {
      return false;
    }

    // Update connected input state on target node
    const targetData = { ...targetNode.data } as Record<string, unknown>;
    if ("connectedInputs" in targetData && typeof targetData.connectedInputs === "object" && targetData.connectedInputs !== null) {
      const connectedInputs = { ...(targetData.connectedInputs as Record<string, boolean>) };
      connectedInputs[connection.targetHandle] = true;
      targetData.connectedInputs = connectedInputs;
    }

    set((state) => ({
      edges: newEdges,
      nodes: state.nodes.map((n) =>
        n.id === connection.target ? { ...n, data: targetData as WorkflowNodeData } : n
      ),
    }));

    get().pushHistory();
    return true;
  },

  addNode: (type, position) => {
    const nodeData = getDefaultNodeData(type);
    const newNode: WorkflowNode = {
      id: `node-${uuidv4()}`,
      type,
      position,
      data: nodeData,
    };

    set((state) => ({ nodes: [...state.nodes, newNode] }));
    get().pushHistory();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } as WorkflowNodeData } : n
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => {
      // Find edges connected to this node and update connectedInputs on target nodes
      const edgesToRemove = state.edges.filter(
        (e) => e.source === nodeId || e.target === nodeId
      );

      const updatedNodes = state.nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => {
          const incomingEdgesToRemove = edgesToRemove.filter(
            (e) => e.target === n.id
          );
          if (incomingEdgesToRemove.length === 0) return n;

          const data = { ...n.data } as Record<string, unknown>;
          if ("connectedInputs" in data && typeof data.connectedInputs === "object" && data.connectedInputs !== null) {
            const connectedInputs = { ...(data.connectedInputs as Record<string, boolean>) };
            for (const edge of incomingEdgesToRemove) {
              if (edge.targetHandle) {
                // Check if there are other edges to the same handle
                const otherEdges = state.edges.filter(
                  (e) =>
                    e.id !== edge.id &&
                    e.target === n.id &&
                    e.targetHandle === edge.targetHandle &&
                    e.source !== nodeId
                );
                if (otherEdges.length === 0) {
                  connectedInputs[edge.targetHandle] = false;
                }
              }
            }
            data.connectedInputs = connectedInputs;
          }
          return { ...n, data: data as WorkflowNodeData };
        });

      return {
        nodes: updatedNodes,
        edges: state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      };
    });
    get().pushHistory();
  },

  deleteSelectedNodes: () => {
    const state = get();
    const selectedIds = state.selectedNodeIds;
    if (selectedIds.size === 0) return;

    for (const id of selectedIds) {
      get().deleteNode(id);
    }
    set({ selectedNodeIds: new Set() });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setViewport: (viewport) => set({ viewport }),
  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  // Undo/Redo
  pushHistory: () => {
    const state = get();
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);
    // Keep max 50 history entries
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    set({
      nodes: JSON.parse(JSON.stringify(entry.nodes)),
      edges: JSON.parse(JSON.stringify(entry.edges)),
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    set({
      nodes: JSON.parse(JSON.stringify(entry.nodes)),
      edges: JSON.parse(JSON.stringify(entry.edges)),
      historyIndex: newIndex,
    });
  },

  // Runs
  addRun: (run) => set((state) => ({ runs: [run, ...state.runs] })),
  updateRun: (runId, updates) =>
    set((state) => ({
      runs: state.runs.map((r) => (r.id === runId ? { ...r, ...updates } : r)),
    })),
  setRuns: (runs) => set({ runs }),

  // UI
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  // Node execution
  setNodeRunning: (nodeId, running) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, isRunning: running, hasError: running ? false : n.data.hasError } as WorkflowNodeData }
          : n
      ),
    }));
  },

  setNodeError: (nodeId, error) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                hasError: !!error,
                errorMessage: error || undefined,
                isRunning: false,
              } as WorkflowNodeData,
            }
          : n
      ),
    }));
  },

  setNodeOutput: (nodeId, output) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = { ...n.data };
        if (data.type === "textNode") {
          return { ...n, data: { ...data, output } as WorkflowNodeData };
        }
        if (data.type === "llmNode") {
          return { ...n, data: { ...data, result: output, output } as WorkflowNodeData };
        }
        if (data.type === "cropImageNode") {
          return { ...n, data: { ...data, result: output, output } as WorkflowNodeData };
        }
        if (data.type === "extractFrameNode") {
          return { ...n, data: { ...data, result: output, output } as WorkflowNodeData };
        }
        return { ...n, data: { ...data, output } as WorkflowNodeData };
      }),
    }));
  },

  // Load/Reset
  loadWorkflow: (id, name, nodes, edges, viewport) => {
    set({
      workflowId: id,
      workflowName: name,
      nodes,
      edges,
      viewport: viewport || { x: 0, y: 0, zoom: 1 },
      history: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
      historyIndex: 0,
    });
  },

  resetWorkflow: () => {
    set({
      workflowId: null,
      workflowName: "Untitled Workflow",
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: new Set(),
      history: [],
      historyIndex: -1,
      runs: [],
    });
  },
}));
