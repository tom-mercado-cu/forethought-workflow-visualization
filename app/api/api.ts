"use server";

import {
  contextVariablesSchema,
  intentsSchema,
  WorkflowData,
  workflowSchema,
} from "@/lib/types";
import { writeFileSync } from "fs";
import { join } from "path";
import { forethoughtFetch } from "./forethought";

const DASHBOARD_API_URL = "https://dashboard-api.forethought.ai";

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

const saveExampleResponse = (data: unknown, filename: string) => {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SAVE_EXAMPLE_RESPONSES === "true"
  ) {
    writeFileSync(
      join(process.cwd(), `examples/${filename}-sample-response.json`),
      JSON.stringify(data, null, 2)
    );
  }
};

export async function getWorkflow(
  workflowId: string,
  { includeWorkflowNames = true }
): Promise<WorkflowData & { workflowNames: Record<string, string> }> {
  const response = await forethoughtFetch(
    `${DASHBOARD_API_URL}/dashboard-controls/solve/v2/workflow-builder/${workflowId}`
  );

  const data = workflowSchema.parse(await response.json());

  saveExampleResponse(data, workflowId);

  if (!includeWorkflowNames) {
    return {
      ...data,
      workflowNames: {} as Record<string, string>,
    };
  }

  const workflowIds = collectWorkflowIds(data.canvas.step_map);
  if (workflowIds.size === 0) {
    return {
      ...data,
      workflowNames: {} as Record<string, string>,
    };
  }

  const workflowNames = await Promise.all(
    Array.from(workflowIds).map(async (id) => {
      return getWorkflow(id, { includeWorkflowNames: false });
    })
  );

  return {
    ...data,
    workflowNames: workflowNames.reduce((acc, curr) => {
      acc[curr.canvas.intent_workflow_id] = curr.canvas.intent_title;
      return acc;
    }, {} as Record<string, string>),
  };
}

export async function getContextVariables() {
  const response = await forethoughtFetch(
    `${DASHBOARD_API_URL}/dashboard-controls/solve/v2/workflow-builder/context-variables`
  );

  const data = contextVariablesSchema.parse(await response.json());

  saveExampleResponse(data, "context-variables");

  return data;
}

export async function getIntents() {
  const response = await forethoughtFetch(
    `${DASHBOARD_API_URL}/dashboard-controls/solve/v2/intents?include_inquiry_counts=false&product=workflow_builder`
  );

  const data = intentsSchema.parse(await response.json());

  saveExampleResponse(data, "intents");

  return data;
}
