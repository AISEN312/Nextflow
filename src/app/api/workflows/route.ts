import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional().default("Untitled Workflow"),
  nodes: z.array(z.any()).optional().default([]),
  edges: z.array(z.any()).optional().default([]),
  viewport: z.any().optional(),
});

const updateWorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  viewport: z.any().optional(),
});

// GET /api/workflows - List all workflows for the current user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        runs: {
          orderBy: { startedAt: "desc" },
          take: 5,
        },
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Failed to fetch workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        userId,
        nodes: data.nodes,
        edges: data.edges,
        viewport: data.viewport,
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}

// PUT /api/workflows - Update an existing workflow
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateWorkflowSchema.parse(body);

    // Verify ownership
    const existing = await prisma.workflow.findFirst({
      where: { id: data.id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    const workflow = await prisma.workflow.update({
      where: { id: data.id },
      data: {
        name: data.name,
        nodes: data.nodes,
        edges: data.edges,
        viewport: data.viewport,
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update workflow:", error);
    return NextResponse.json(
      { error: "Failed to update workflow" },
      { status: 500 }
    );
  }
}
