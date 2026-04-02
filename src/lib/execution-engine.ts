import type {
  WorkflowNode,
  WorkflowEdge,
  NodeResult,
  WorkflowRunEntry,
  NodeType,
} from "@/types/workflow";
import { getExecutionLevels, getUpstreamNodes } from "@/lib/dag";
import { v4 as uuidv4 } from "uuid";

interface ExecutionContext {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  nodeOutputs: Map<string, string>;
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: NodeResult) => void;
  onNodeError?: (nodeId: string, error: string) => void;
}

/**
 * Resolves the input value for a node's handle by looking at connected edges.
 */
function resolveInput(
  nodeId: string,
  handleId: string,
  ctx: ExecutionContext
): string | string[] | null {
  const connectedEdges = ctx.edges.filter(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );

  if (connectedEdges.length === 0) return null;

  // For handles that support multiple connections (like images), return array
  if (handleId === "images") {
    return connectedEdges
      .map((e) => ctx.nodeOutputs.get(e.source))
      .filter((v): v is string => !!v);
  }

  // For single connections, return the first value
  const sourceOutput = ctx.nodeOutputs.get(connectedEdges[0].source);
  return sourceOutput || null;
}

/**
 * Executes a single node and returns the result.
 */
async function executeNode(
  node: WorkflowNode,
  ctx: ExecutionContext
): Promise<NodeResult> {
  const startTime = Date.now();
  const nodeType = node.data.type as NodeType;

  try {
    let output = "";

    switch (nodeType) {
      case "textNode": {
        const textData = node.data as { text?: string };
        output = textData.text || "";
        break;
      }

      case "uploadImageNode": {
        const imgData = node.data as { imageUrl?: string };
        output = imgData.imageUrl || "";
        if (!output) throw new Error("No image uploaded");
        break;
      }

      case "uploadVideoNode": {
        const vidData = node.data as { videoUrl?: string };
        output = vidData.videoUrl || "";
        if (!output) throw new Error("No video uploaded");
        break;
      }

      case "llmNode": {
        const llmData = node.data as {
          model?: string;
          systemPrompt?: string;
          userMessage?: string;
        };

        const systemPrompt =
          (resolveInput(node.id, "system_prompt", ctx) as string) ||
          llmData.systemPrompt ||
          "";
        const userMessage =
          (resolveInput(node.id, "user_message", ctx) as string) ||
          llmData.userMessage ||
          "";
        const images =
          (resolveInput(node.id, "images", ctx) as string[]) || [];

        if (!userMessage) throw new Error("User message is required");

        const res = await fetch("/api/execute/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: llmData.model || "gemini-2.0-flash",
            systemPrompt,
            userMessage,
            imageUrls: images,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "LLM execution failed");
        }

        const result = await res.json();
        output = result.text || "";
        break;
      }

      case "cropImageNode": {
        const cropData = node.data as {
          xPercent?: number;
          yPercent?: number;
          widthPercent?: number;
          heightPercent?: number;
        };

        const imageUrl = resolveInput(node.id, "image_url", ctx) as string;
        if (!imageUrl) throw new Error("Image input is required");

        const xPercent =
          (resolveInput(node.id, "x_percent", ctx) as string) ||
          String(cropData.xPercent ?? 0);
        const yPercent =
          (resolveInput(node.id, "y_percent", ctx) as string) ||
          String(cropData.yPercent ?? 0);
        const widthPercent =
          (resolveInput(node.id, "width_percent", ctx) as string) ||
          String(cropData.widthPercent ?? 100);
        const heightPercent =
          (resolveInput(node.id, "height_percent", ctx) as string) ||
          String(cropData.heightPercent ?? 100);

        const res = await fetch("/api/execute/crop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            xPercent: parseFloat(xPercent),
            yPercent: parseFloat(yPercent),
            widthPercent: parseFloat(widthPercent),
            heightPercent: parseFloat(heightPercent),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Crop execution failed");
        }

        const result = await res.json();
        output = result.url || "";
        break;
      }

      case "extractFrameNode": {
        const frameData = node.data as { timestamp?: string };

        const videoUrl = resolveInput(node.id, "video_url", ctx) as string;
        if (!videoUrl) throw new Error("Video input is required");

        const timestamp =
          (resolveInput(node.id, "timestamp", ctx) as string) ||
          frameData.timestamp ||
          "0";

        const res = await fetch("/api/execute/extract-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl, timestamp }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Frame extraction failed");
        }

        const result = await res.json();
        output = result.url || "";
        break;
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    ctx.nodeOutputs.set(node.id, output);

    return {
      nodeId: node.id,
      nodeLabel: (node.data as { label?: string }).label || nodeType,
      nodeType,
      status: "success",
      output,
      duration,
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      nodeId: node.id,
      nodeLabel: (node.data as { label?: string }).label || nodeType,
      nodeType,
      status: "failed",
      error: errorMessage,
      duration,
    };
  }
}

/**
 * Executes the workflow with parallel execution of independent branches.
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  nodeIds?: string[],
  callbacks?: {
    onNodeStart?: (nodeId: string) => void;
    onNodeComplete?: (nodeId: string, result: NodeResult) => void;
  }
): Promise<{
  run: WorkflowRunEntry;
  nodeResults: NodeResult[];
}> {
  const startTime = Date.now();
  const runId = uuidv4();

  // Determine which nodes to execute
  let targetNodeIds: string[];
  let scope: "full" | "partial" | "single";

  if (!nodeIds || nodeIds.length === 0) {
    targetNodeIds = nodes.map((n) => n.id);
    scope = "full";
  } else if (nodeIds.length === 1) {
    // Single node + its upstream dependencies
    const upstream = getUpstreamNodes(nodeIds[0], edges);
    targetNodeIds = [...upstream, nodeIds[0]];
    scope = "single";
  } else {
    // Selected nodes + their upstream dependencies
    const allIds = new Set(nodeIds);
    for (const id of nodeIds) {
      const upstream = getUpstreamNodes(id, edges);
      upstream.forEach((u) => allIds.add(u));
    }
    targetNodeIds = Array.from(allIds);
    scope = "partial";
  }

  const executionNodes = nodes.filter((n) => targetNodeIds.includes(n.id));
  const levels = getExecutionLevels(executionNodes, edges, targetNodeIds);

  const ctx: ExecutionContext = {
    nodes,
    edges,
    nodeOutputs: new Map(),
    onNodeStart: callbacks?.onNodeStart,
    onNodeComplete: callbacks?.onNodeComplete,
  };

  const allResults: NodeResult[] = [];
  let hasError = false;

  // Execute level by level (nodes in same level run in parallel)
  for (const level of levels) {
    const levelNodes = level
      .map((id) => executionNodes.find((n) => n.id === id))
      .filter((n): n is WorkflowNode => !!n);

    // Notify node starts
    for (const node of levelNodes) {
      callbacks?.onNodeStart?.(node.id);
    }

    // Execute all nodes in this level in parallel
    const results = await Promise.all(
      levelNodes.map((node) => executeNode(node, ctx))
    );

    for (const result of results) {
      allResults.push(result);
      callbacks?.onNodeComplete?.(result.nodeId, result);
      if (result.status === "failed") {
        hasError = true;
      }
    }
  }

  const duration = (Date.now() - startTime) / 1000;

  const run: WorkflowRunEntry = {
    id: runId,
    workflowId: "",
    status: hasError
      ? allResults.every((r) => r.status === "failed")
        ? "failed"
        : "partial"
      : "success",
    scope,
    duration,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    nodeResults: allResults,
    nodeCount: nodeIds?.length,
  };

  return { run, nodeResults: allResults };
}
