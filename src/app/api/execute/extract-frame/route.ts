import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const extractFrameSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  timestamp: z.string().default("0"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = extractFrameSchema.parse(body);

    // If Trigger.dev is configured, use it
    const triggerApiKey = process.env.TRIGGER_SECRET_KEY;
    if (triggerApiKey && process.env.TRIGGER_API_URL) {
      try {
        const triggerRes = await fetch(
          `${process.env.TRIGGER_API_URL}/api/v1/tasks/extract-frame/trigger`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${triggerApiKey}`,
            },
            body: JSON.stringify({
              payload: {
                videoUrl: data.videoUrl,
                timestamp: data.timestamp,
              },
            }),
          }
        );

        if (triggerRes.ok) {
          const result = await triggerRes.json();
          return NextResponse.json({
            url: result.output?.url || "",
          });
        }
      } catch (err) {
        console.error("Trigger.dev extract-frame task error:", err);
      }
    }

    // Fallback: return metadata about what would be extracted
    // In production, this would use FFmpeg via Trigger.dev
    return NextResponse.json({
      url: "",
      extractionParams: {
        videoUrl: data.videoUrl,
        timestamp: data.timestamp,
      },
      note: "Frame extraction requires Trigger.dev configuration with FFmpeg.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Extract frame error:", error);
    return NextResponse.json(
      { error: "Frame extraction failed" },
      { status: 500 }
    );
  }
}
