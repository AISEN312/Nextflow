"use client";

import dynamic from "next/dynamic";

const WorkflowEditor = dynamic(
  () =>
    import("@/components/workflow/workflow-editor").then(
      (mod) => mod.WorkflowEditor
    ),
  { ssr: false }
);

export default function WorkflowPage() {
  return <WorkflowEditor />;
}
