"use client";

import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowCanvas } from "./workflow-canvas";
import { Toolbar } from "./toolbar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";

export function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-screen bg-zinc-950">
        <Toolbar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <WorkflowCanvas />
          <RightSidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
