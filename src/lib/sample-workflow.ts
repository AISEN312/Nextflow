import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

/**
 * Pre-built Sample Workflow: Product Marketing Kit Generator
 *
 * Demonstrates all 6 node types, parallel execution,
 * input chaining, and branch convergence.
 *
 * Branch A: Image Processing + Product Description
 * Branch B: Video Frame Extraction
 * Convergence: Final Marketing Summary
 */
export function getSampleWorkflow(): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const nodes: WorkflowNode[] = [
    // Branch A: Upload Image -> Crop Image
    {
      id: "node-upload-image",
      type: "uploadImageNode",
      position: { x: 50, y: 50 },
      data: {
        label: "Upload Image",
        type: "uploadImageNode",
        imageUrl: "",
        fileName: "",
      },
    },
    {
      id: "node-crop-image",
      type: "cropImageNode",
      position: { x: 400, y: 30 },
      data: {
        label: "Crop Image",
        type: "cropImageNode",
        imageUrl: "",
        xPercent: 10,
        yPercent: 10,
        widthPercent: 80,
        heightPercent: 80,
        result: "",
        connectedInputs: {
          image_url: true,
          x_percent: false,
          y_percent: false,
          width_percent: false,
          height_percent: false,
        },
      },
    },
    // Branch A: Text nodes for system prompt and product details
    {
      id: "node-system-prompt-1",
      type: "textNode",
      position: { x: 50, y: 280 },
      data: {
        label: "Text",
        type: "textNode",
        text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description based on the product image and details provided.",
      },
    },
    {
      id: "node-product-details",
      type: "textNode",
      position: { x: 50, y: 430 },
      data: {
        label: "Text",
        type: "textNode",
        text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design.",
      },
    },
    // Branch A: LLM Node #1
    {
      id: "node-llm-1",
      type: "llmNode",
      position: { x: 750, y: 100 },
      data: {
        label: "Run Any LLM",
        type: "llmNode",
        model: "gemini-2.0-flash",
        systemPrompt: "",
        userMessage: "",
        imageUrls: [],
        result: "",
        connectedInputs: {
          system_prompt: true,
          user_message: true,
          images: true,
        },
      },
    },

    // Branch B: Upload Video -> Extract Frame
    {
      id: "node-upload-video",
      type: "uploadVideoNode",
      position: { x: 50, y: 620 },
      data: {
        label: "Upload Video",
        type: "uploadVideoNode",
        videoUrl: "",
        fileName: "",
      },
    },
    {
      id: "node-extract-frame",
      type: "extractFrameNode",
      position: { x: 400, y: 620 },
      data: {
        label: "Extract Frame",
        type: "extractFrameNode",
        videoUrl: "",
        timestamp: "50%",
        result: "",
        connectedInputs: {
          video_url: true,
          timestamp: false,
        },
      },
    },

    // Convergence: Text Node #3 (system prompt for final LLM)
    {
      id: "node-system-prompt-2",
      type: "textNode",
      position: { x: 750, y: 550 },
      data: {
        label: "Text",
        type: "textNode",
        text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame. Be catchy and include relevant emojis.",
      },
    },
    // Convergence: LLM Node #2
    {
      id: "node-llm-2",
      type: "llmNode",
      position: { x: 1100, y: 300 },
      data: {
        label: "Run Any LLM",
        type: "llmNode",
        model: "gemini-2.0-flash",
        systemPrompt: "",
        userMessage: "",
        imageUrls: [],
        result: "",
        connectedInputs: {
          system_prompt: true,
          user_message: true,
          images: true,
        },
      },
    },
  ];

  const edges: WorkflowEdge[] = [
    // Branch A connections
    {
      id: "e-upload-to-crop",
      source: "node-upload-image",
      target: "node-crop-image",
      sourceHandle: "output",
      targetHandle: "image_url",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-sysprompt1-to-llm1",
      source: "node-system-prompt-1",
      target: "node-llm-1",
      sourceHandle: "output",
      targetHandle: "system_prompt",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-details-to-llm1",
      source: "node-product-details",
      target: "node-llm-1",
      sourceHandle: "output",
      targetHandle: "user_message",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-crop-to-llm1",
      source: "node-crop-image",
      target: "node-llm-1",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },

    // Branch B connections
    {
      id: "e-video-to-extract",
      source: "node-upload-video",
      target: "node-extract-frame",
      sourceHandle: "output",
      targetHandle: "video_url",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },

    // Convergence connections
    {
      id: "e-sysprompt2-to-llm2",
      source: "node-system-prompt-2",
      target: "node-llm-2",
      sourceHandle: "output",
      targetHandle: "system_prompt",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-llm1-to-llm2",
      source: "node-llm-1",
      target: "node-llm-2",
      sourceHandle: "output",
      targetHandle: "user_message",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-crop-to-llm2",
      source: "node-crop-image",
      target: "node-llm-2",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
    {
      id: "e-frame-to-llm2",
      source: "node-extract-frame",
      target: "node-llm-2",
      sourceHandle: "output",
      targetHandle: "images",
      animated: true,
      style: { stroke: "#a855f7", strokeWidth: 2 },
    },
  ];

  return { nodes, edges };
}
