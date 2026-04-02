import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const cropSchema = z.object({
  imageUrl: z.string().url("Valid image URL is required"),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(1).max(100).default(100),
  heightPercent: z.number().min(1).max(100).default(100),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = cropSchema.parse(body);

    // If Trigger.dev is configured, use it
    const triggerApiKey = process.env.TRIGGER_SECRET_KEY;
    if (triggerApiKey && process.env.TRIGGER_API_URL) {
      try {
        const triggerRes = await fetch(
          `${process.env.TRIGGER_API_URL}/api/v1/tasks/crop-image/trigger`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${triggerApiKey}`,
            },
            body: JSON.stringify({
              payload: {
                imageUrl: data.imageUrl,
                xPercent: data.xPercent,
                yPercent: data.yPercent,
                widthPercent: data.widthPercent,
                heightPercent: data.heightPercent,
              },
            }),
          }
        );

        if (triggerRes.ok) {
          const result = await triggerRes.json();
          return NextResponse.json({ url: result.output?.url || data.imageUrl });
        }
      } catch (err) {
        console.error("Trigger.dev crop task error:", err);
      }
    }

    // Fallback: return original image with crop parameters as metadata
    // In production, this would use FFmpeg via Trigger.dev
    return NextResponse.json({
      url: data.imageUrl,
      cropApplied: {
        x: data.xPercent,
        y: data.yPercent,
        width: data.widthPercent,
        height: data.heightPercent,
      },
      note: "Crop processing requires Trigger.dev configuration. Image returned with crop metadata.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Crop execution error:", error);
    return NextResponse.json(
      { error: "Crop execution failed" },
      { status: 500 }
    );
  }
}
