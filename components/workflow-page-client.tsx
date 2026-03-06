"use client";

import { FindIssuesPanel } from "@/components/find-issues-panel";
import { WorkflowTree, type WorkflowTreeHandle } from "@/components/workflow-tree";
import { Button } from "@/components/ui/button";
import type { ContextVariables, WorkflowData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

interface WorkflowPageClientProps {
  workflow: WorkflowData;
  workflowNames: Record<string, string>;
  contextVariables: ContextVariables;
}

export function WorkflowPageClient({
  workflow,
  workflowNames,
  contextVariables,
}: WorkflowPageClientProps) {
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const treeRef = useRef<WorkflowTreeHandle>(null);

  return (
    <div className="flex flex-col gap-4 max-h-[calc(100vh-10rem)] overflow-hidden">
      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {workflow.canvas.intent_title}
          </h2>
          <p className="text-sm text-slate-600">
            Version {workflow.canvas.version} •{" "}
            {workflow.canvas.is_draft ? "Draft" : "Published"} •{" "}
            {Object.keys(workflow.canvas.step_map).length} steps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FindIssuesPanel
            workflow={workflow}
            onIssuesFound={setHighlightedNodeIds}
            onNavigateToNode={(nodeId) => treeRef.current?.navigateTo(nodeId)}
          />
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Load Different Workflow
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full">
          <WorkflowTree
            ref={treeRef}
            workflow={workflow}
            workflowNames={workflowNames}
            contextVariables={contextVariables}
            highlightedNodeIds={highlightedNodeIds}
          />
        </div>
      </div>
    </div>
  );
}
