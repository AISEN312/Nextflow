import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

/**
 * Validates that the workflow graph is a DAG (no cycles).
 * Returns true if valid (no cycles), false if cycles exist.
 */
export function validateDAG(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited++;
    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return visited === nodes.length;
}

/**
 * Gets the topological execution order for a set of nodes.
 * Returns nodes grouped by execution level (nodes in same level can run in parallel).
 */
export function getExecutionLevels(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  selectedNodeIds?: string[]
): string[][] {
  const nodeSet = new Set(selectedNodeIds || nodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => nodeSet.has(e.source) && nodeSet.has(e.target)
  );

  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const nodeId of nodeSet) {
    adjacencyList.set(nodeId, []);
    inDegree.set(nodeId, 0);
  }

  for (const edge of filteredEdges) {
    const neighbors = adjacencyList.get(edge.source);
    if (neighbors) {
      neighbors.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const levels: string[][] = [];
  let queue: string[] = [];

  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    levels.push([...queue]);
    const nextQueue: string[] = [];

    for (const current of queue) {
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          nextQueue.push(neighbor);
        }
      }
    }

    queue = nextQueue;
  }

  return levels;
}

/**
 * Gets all upstream dependencies for a given node.
 */
export function getUpstreamNodes(
  nodeId: string,
  edges: WorkflowEdge[]
): string[] {
  const upstream: Set<string> = new Set();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.target === current && !upstream.has(edge.source)) {
        upstream.add(edge.source);
        queue.push(edge.source);
      }
    }
  }

  return Array.from(upstream);
}
