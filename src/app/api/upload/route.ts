import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

    if (fileType === "image" && !validImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Accepted: jpg, jpeg, png, webp, gif" },
        { status: 400 }
      );
    }

    if (fileType === "video" && !validVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid video type. Accepted: mp4, mov, webm, m4v" },
        { status: 400 }
      );
    }

    // If Transloadit is configured, upload via Transloadit
    const transloaditKey = process.env.TRANSLOADIT_AUTH_KEY;
    const transloaditSecret = process.env.TRANSLOADIT_AUTH_SECRET;

    if (transloaditKey && transloaditSecret) {
      try {
        const transloaditForm = new FormData();
        transloaditForm.append("file", file);

        const params = JSON.stringify({
          auth: { key: transloaditKey },
          steps: {
            ":original": { robot: "/upload/handle" },
            store: {
              use: ":original",
              robot: "/s3/store",
              credentials: "s3_credentials",
            },
          },
        });
        transloaditForm.append("params", params);

        const uploadRes = await fetch(
          "https://api2.transloadit.com/assemblies",
          {
            method: "POST",
            body: transloaditForm,
          }
        );

        if (uploadRes.ok) {
          const result = await uploadRes.json() as {
            ok?: string;
            results?: Record<string, Array<{ ssl_url?: string }>>;
          };
          const uploadedUrl =
            result.results?.[":original"]?.[0]?.ssl_url || "";
          return NextResponse.json({ url: uploadedUrl });
        }
      } catch (err) {
        console.error("Transloadit upload error:", err);
      }
    }

    // Fallback: Convert to base64 data URL for local development
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      note: "File stored as data URL. Configure Transloadit for cloud storage.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
