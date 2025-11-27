import { Button } from "@/components/ui/button";
import { WorkflowTree } from "@/components/workflow-tree";
import { ArrowLeft } from "lucide-react";
import { getWorkflow } from "../../api";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const { workflowNames, ...workflow } = await getWorkflow(workflowId, {
    includeWorkflowNames: true,
  });

  return (
    <div className="flex flex-col gap-4">
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
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Load Different Workflow
        </Button>
      </div>

      {workflow && (
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            <WorkflowTree workflow={workflow} workflowNames={workflowNames} />
          </div>
        </div>
      )}
    </div>
  );
}
