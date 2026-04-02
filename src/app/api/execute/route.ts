import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { executeWorkflow } from "@/lib/execution-engine";
import { prisma } from "@/lib/prisma";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

const executeSchema = z.object({
  workflowId: z.string().nullable().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  nodeIds: z.array(z.string()).optional(),
  mode: z.enum(["full", "selected", "single"]).optional().default("full"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = executeSchema.parse(body);

    const nodes = data.nodes as WorkflowNode[];
    const edges = data.edges as WorkflowEdge[];

    const { run, nodeResults } = await executeWorkflow(
      nodes,
      edges,
      data.nodeIds
    );

    // Set the workflowId on the run
    run.workflowId = data.workflowId || "";

    // Persist run to database if we have a workflowId
    if (data.workflowId) {
      try {
        await prisma.workflowRun.create({
          data: {
            id: run.id,
            workflowId: data.workflowId,
            userId,
            status: run.status,
            scope: run.scope,
            duration: run.duration,
            startedAt: new Date(run.startedAt),
            completedAt: run.completedAt ? new Date(run.completedAt) : null,
            nodeResults: JSON.parse(JSON.stringify(nodeResults)),
          },
        });
      } catch (dbError) {
        console.error("Failed to persist run:", dbError);
        // Continue even if persistence fails
      }
    }

    return NextResponse.json({ run, nodeResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Execution error:", error);
    return NextResponse.json(
      { error: "Execution failed" },
      { status: 500 }
    );
  }
}
