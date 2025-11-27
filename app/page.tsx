"use client";

import { Button } from "@/components/ui/button";
import { WorkflowForm } from "@/components/workflow-form";
import { WorkflowTree } from "@/components/workflow-tree";
import { workflowSchema, type WorkflowData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [workflowNames, setWorkflowNames] = useState<Record<string, string>>(
    {}
  );

  const collectWorkflowIds = (
    stepMap: WorkflowData["canvas"]["step_map"]
  ): Set<string> => {
    const workflowIds = new Set<string>();
    Object.values(stepMap).forEach((step) => {
      if (step.step_fields.intent_workflow_id) {
        workflowIds.add(step.step_fields.intent_workflow_id);
      }
    });
    return workflowIds;
  };

  const fetchWorkflowName = async (
    token: string,
    workflowId: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(`/api/workflow/${workflowId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.canvas?.intent_title || null;
    } catch (error) {
      console.error(`Error fetching workflow ${workflowId}:`, error);
      return null;
    }
  };

  const fetchWorkflowNames = async (token: string, workflow: WorkflowData) => {
    const workflowIds = collectWorkflowIds(workflow.canvas.step_map);
    if (workflowIds.size === 0) return;

    const results = await Promise.all(
      Array.from(workflowIds).map(async (id) => {
        const name = await fetchWorkflowName(token, id);
        return { id, name };
      })
    );

    const names: Record<string, string> = {};
    results.forEach(({ id, name }) => {
      if (name) {
        names[id] = name;
      }
    });

    setWorkflowNames(names);
  };

  const fetchWorkflow = async (token: string, workflowId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workflow/${workflowId}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch workflow: ${response.statusText}`
        );
      }

      const data = await response.json();

      const validatedData = workflowSchema.parse(data);
      setWorkflow(validatedData);

      // Fetch workflow names for referenced workflows
      await fetchWorkflowNames(token, validatedData);

      toast.success("Workflow loaded successfully", {
        description: `Loaded workflow: ${validatedData.canvas.intent_title}`,
      });
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow", {
        description:
          error instanceof Error ? error.message : "Failed to load workflow",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWorkflow(null);
    setWorkflowNames({});
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      <div className="flex-none p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Chatbot Workflow Visualizer
            </h1>
            <p className="text-slate-600">
              Transform complex chatbot flows into clear, interactive decision
              trees
            </p>
          </div>

          {!workflow ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <WorkflowForm onSubmit={fetchWorkflow} loading={loading} />
            </div>
          ) : (
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
              <Button onClick={handleReset} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Load Different Workflow
              </Button>
            </div>
          )}
        </div>
      </div>

      {workflow && (
        <div className="flex-1 overflow-hidden px-4 md:px-8 pb-4 md:pb-8">
          <div className="max-w-7xl mx-auto h-full">
            <WorkflowTree workflow={workflow} workflowNames={workflowNames} />
          </div>
        </div>
      )}
    </div>
  );
}
