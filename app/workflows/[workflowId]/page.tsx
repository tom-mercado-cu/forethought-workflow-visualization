import { Button } from "@/components/ui/button";
import { WorkflowTree } from "@/components/workflow-tree";
import type { ContextVariables, Transition, WorkflowData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getContextVariables, getWorkflow } from "../../api/api";

/**
 * Builds a map from context variable IDs to their names
 */
function buildContextVariableMap(
  contextVariables: ContextVariables
): Map<string, string> {
  const map = new Map<string, string>();

  // Add context_variables
  contextVariables.context_variables.forEach((cv) => {
    if (cv.context_variable_id) {
      map.set(cv.context_variable_id, cv.context_variable_name);
    }
  });

  // Add template_context_variables
  contextVariables.template_context_variables.forEach((cv) => {
    if (cv.context_variable_id) {
      map.set(cv.context_variable_id, cv.context_variable_name);
    }
  });

  // Add usable_system_context_variables
  contextVariables.usable_system_context_variables.forEach((cv) => {
    if (cv.context_variable_id) {
      map.set(cv.context_variable_id, cv.context_variable_name);
    }
  });

  return map;
}

/**
 * Finds the button option display name by searching for the step that contains
 * the transition with this value
 */
function getButtonOptionDisplayName(
  fieldId: string,
  valueId: string,
  workflow: WorkflowData
): string | null {
  // Search through all steps to find a buttons step that has a transition
  // with this field and value
  for (const step of Object.values(workflow.canvas.step_map)) {
    if (step.step_type === "buttons") {
      // Check if this step has transitions with the matching field and value
      const matchingTransition = step.transitions.find((transition) => {
        const expr = transition.condition_expression;
        return (
          expr &&
          expr.field === fieldId &&
          expr.values &&
          expr.values.includes(valueId)
        );
      });

      if (matchingTransition) {
        // Look for options in step_fields - they might be in a field like "options", "buttons", etc.
        const stepFields = step.step_fields as Record<string, unknown>;

        // Try common field names for button options
        const possibleFields = [
          "options",
          "buttons",
          "button_options",
          "choices",
        ];
        for (const fieldName of possibleFields) {
          const options = stepFields[fieldName];
          if (Array.isArray(options)) {
            for (const option of options) {
              if (
                typeof option === "object" &&
                option !== null &&
                "value" in option &&
                "display_name" in option &&
                option.value === valueId
              ) {
                return String(option.display_name);
              }
              // Also try "label" instead of "display_name"
              if (
                typeof option === "object" &&
                option !== null &&
                "value" in option &&
                "label" in option &&
                option.value === valueId
              ) {
                return String(option.label);
              }
            }
          }
        }
      }
    }
  }

  return null;
}

/**
 * Replaces context variable IDs in a condition expression recursively
 * Also replaces button option values with their display names
 */
function replaceIdsInConditionExpression(
  expression: Transition["condition_expression"],
  idMap: Map<string, string>,
  workflow: WorkflowData
): Transition["condition_expression"] {
  if (!expression) return null;

  const newExpression: typeof expression = { ...expression };

  // Replace field if it exists
  const originalFieldId = newExpression.field;
  if (newExpression.field) {
    const id = newExpression.field;
    const name = idMap.get(id);
    if (name) {
      newExpression.field = name;
    }
  }

  // Replace values with display names if this is a button option
  if (
    originalFieldId &&
    newExpression.values &&
    Array.isArray(newExpression.values)
  ) {
    newExpression.values = newExpression.values.map((value) => {
      const valueStr = String(value);
      const displayName = getButtonOptionDisplayName(
        originalFieldId,
        valueStr,
        workflow
      );
      return displayName !== null ? displayName : value;
    });
  }

  // Recursively process nested expressions
  if (newExpression.expressions && Array.isArray(newExpression.expressions)) {
    newExpression.expressions = newExpression.expressions.map((exp) =>
      replaceIdsInConditionExpression(exp, idMap, workflow)
    );
  }

  return newExpression;
}

/**
 * Replaces context variable IDs in text (messages/prompts)
 * Handles both {{id}} and {{id/./path}} syntax
 */
function replaceIdsInText(text: string, idMap: Map<string, string>): string {
  // Match {{id}} or {{id/./path}} patterns
  return text.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
    // Check if it's a path like "id/./path"
    if (content.includes("/./")) {
      const [id] = content.split("/./");
      const name = idMap.get(id);
      if (name) {
        return `{{${name}/./${content.substring(id.length + 3)}}}`;
      }
    } else {
      // Simple ID
      const name = idMap.get(content);
      if (name) {
        return `{{${name}}}`;
      }
    }
    return match; // Return original if no match found
  });
}

/**
 * Replaces all context variable IDs with their names in the workflow
 */
function replaceContextVariableIds(
  workflow: WorkflowData,
  contextVariables: ContextVariables
): WorkflowData {
  const idMap = buildContextVariableMap(contextVariables);
  const newWorkflow = JSON.parse(JSON.stringify(workflow)) as WorkflowData;

  // Process each step in step_map
  Object.values(newWorkflow.canvas.step_map).forEach((step) => {
    // Replace IDs in step_fields.message
    if (step.step_fields.message) {
      step.step_fields.message = replaceIdsInText(
        step.step_fields.message,
        idMap
      );
    }

    // Replace IDs in step_fields.prompt
    if (step.step_fields.prompt) {
      step.step_fields.prompt = replaceIdsInText(
        step.step_fields.prompt,
        idMap
      );
    }

    // Replace IDs in step_fields.url
    if (step.step_fields.url) {
      step.step_fields.url = replaceIdsInText(step.step_fields.url, idMap);
    }

    // Process transitions
    step.transitions.forEach((transition) => {
      if (transition.condition_expression) {
        transition.condition_expression = replaceIdsInConditionExpression(
          transition.condition_expression,
          idMap,
          newWorkflow
        );
      }
    });
  });

  return newWorkflow;
}

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const [{ workflowNames, ...workflow }, contextVariables] = await Promise.all([
    getWorkflow(workflowId, {
      includeWorkflowNames: true,
    }),
    getContextVariables(),
  ]);

  // Replace context variable IDs with their names
  const transformedWorkflow = replaceContextVariableIds(
    workflow,
    contextVariables
  );

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
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Load Different Workflow
          </Link>
        </Button>
      </div>

      {transformedWorkflow && (
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            <WorkflowTree
              workflow={transformedWorkflow}
              workflowNames={workflowNames}
              contextVariables={contextVariables}
            />
          </div>
        </div>
      )}
    </div>
  );
}
