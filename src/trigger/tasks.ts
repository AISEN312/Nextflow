/**
 * Trigger.dev Task Definitions
 *
 * These task definitions outline the Trigger.dev tasks that execute
 * node operations. In production, these would be registered with
 * Trigger.dev and executed as background tasks.
 *
 * Tasks:
 * 1. llm-execution - Calls Google Gemini API
 * 2. crop-image - Crops images using FFmpeg
 * 3. extract-frame - Extracts frames from video using FFmpeg
 *
 * Setup:
 * 1. Install @trigger.dev/sdk
 * 2. Configure TRIGGER_SECRET_KEY and TRIGGER_API_URL
 * 3. Register these tasks with your Trigger.dev project
 */

// Task: LLM Execution via Google Gemini
export interface LLMTaskPayload {
  model: string;
  systemPrompt: string;
  userMessage: string;
  imageUrls: string[];
}

export interface LLMTaskOutput {
  text: string;
}

// Task: Crop Image via FFmpeg
export interface CropImageTaskPayload {
  imageUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export interface CropImageTaskOutput {
  url: string;
}

// Task: Extract Frame from Video via FFmpeg
export interface ExtractFrameTaskPayload {
  videoUrl: string;
  timestamp: string; // seconds or "50%" for percentage
}

export interface ExtractFrameTaskOutput {
  url: string;
}

/**
 * Example Trigger.dev task registration (requires @trigger.dev/sdk):
 *
 * ```typescript
 * import { task } from "@trigger.dev/sdk/v3";
 * import { exec } from "child_process";
 * import { promisify } from "util";
 *
 * const execAsync = promisify(exec);
 *
 * export const cropImageTask = task({
 *   id: "crop-image",
 *   run: async (payload: CropImageTaskPayload) => {
 *     const { imageUrl, xPercent, yPercent, widthPercent, heightPercent } = payload;
 *
 *     // Download image
 *     const inputPath = `/tmp/input-${Date.now()}.jpg`;
 *     const outputPath = `/tmp/output-${Date.now()}.jpg`;
 *
 *     await execAsync(`curl -o ${inputPath} "${imageUrl}"`);
 *
 *     // Get image dimensions
 *     const { stdout: dims } = await execAsync(
 *       `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${inputPath}`
 *     );
 *     const [imgWidth, imgHeight] = dims.trim().split(",").map(Number);
 *
 *     // Calculate crop dimensions
 *     const cropX = Math.round((xPercent / 100) * imgWidth);
 *     const cropY = Math.round((yPercent / 100) * imgHeight);
 *     const cropW = Math.round((widthPercent / 100) * imgWidth);
 *     const cropH = Math.round((heightPercent / 100) * imgHeight);
 *
 *     // Run FFmpeg crop
 *     await execAsync(
 *       `ffmpeg -i ${inputPath} -vf "crop=${cropW}:${cropH}:${cropX}:${cropY}" ${outputPath}`
 *     );
 *
 *     // Upload to Transloadit and return URL
 *     // ... upload logic here ...
 *
 *     return { url: uploadedUrl };
 *   },
 * });
 *
 * export const extractFrameTask = task({
 *   id: "extract-frame",
 *   run: async (payload: ExtractFrameTaskPayload) => {
 *     const { videoUrl, timestamp } = payload;
 *
 *     const inputPath = `/tmp/video-${Date.now()}.mp4`;
 *     const outputPath = `/tmp/frame-${Date.now()}.jpg`;
 *
 *     await execAsync(`curl -o ${inputPath} "${videoUrl}"`);
 *
 *     let seekTime = timestamp;
 *     if (timestamp.endsWith("%")) {
 *       // Get video duration and calculate timestamp
 *       const { stdout: duration } = await execAsync(
 *         `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`
 *       );
 *       const totalDuration = parseFloat(duration.trim());
 *       const percentage = parseFloat(timestamp.replace("%", ""));
 *       seekTime = String((percentage / 100) * totalDuration);
 *     }
 *
 *     await execAsync(
 *       `ffmpeg -ss ${seekTime} -i ${inputPath} -frames:v 1 ${outputPath}`
 *     );
 *
 *     // Upload to Transloadit and return URL
 *     // ... upload logic here ...
 *
 *     return { url: uploadedUrl };
 *   },
 * });
 * ```
 */
