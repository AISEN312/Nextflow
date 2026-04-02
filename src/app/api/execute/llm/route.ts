import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const llmSchema = z.object({
  model: z.string().default("gemini-2.0-flash"),
  systemPrompt: z.string().optional().default(""),
  userMessage: z.string().min(1, "User message is required"),
  imageUrls: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = llmSchema.parse(body);

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 }
      );
    }

    // Build the request for Gemini API
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

    // System instruction (if provided)
    const systemInstruction = data.systemPrompt
      ? { parts: [{ text: data.systemPrompt }] }
      : undefined;

    // User message parts
    const userParts: Array<Record<string, unknown>> = [];
    userParts.push({ text: data.userMessage });

    // Add images as inline data if they are base64, or as file URIs
    for (const imageUrl of data.imageUrls) {
      if (imageUrl.startsWith("data:")) {
        // Base64 image
        const [meta, base64Data] = imageUrl.split(",");
        const mimeType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
        userParts.push({
          inlineData: { mimeType, data: base64Data },
        });
      } else if (imageUrl.startsWith("http")) {
        // Try to fetch and convert to base64
        try {
          const imgRes = await fetch(imageUrl);
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          userParts.push({
            inlineData: { mimeType: contentType, data: base64 },
          });
        } catch {
          // Skip images that can't be fetched
          console.warn("Failed to fetch image:", imageUrl);
        }
      }
    }

    contents.push({ role: "user", parts: userParts });

    const geminiBody: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    if (systemInstruction) {
      geminiBody.systemInstruction = systemInstruction;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${data.model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: `Gemini API error: ${(errorData as { error?: { message?: string } }).error?.message || geminiRes.statusText}` },
        { status: geminiRes.status }
      );
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("LLM execution error:", error);
    return NextResponse.json(
      { error: "LLM execution failed" },
      { status: 500 }
    );
  }
}
