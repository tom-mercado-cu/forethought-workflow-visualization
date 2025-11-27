import { z } from "zod";

// Define flexible schemas that can handle the dynamic nature of step_map
const transitionSchema = z.object({
  step_id: z.string(),
  condition_expression: z.union([
    z.object({
      negate: z.boolean().optional(),
      allow_more_than_one_value: z.boolean().optional(),
      ignore_case: z.boolean().optional(),
      field: z.string().optional(),
      operator: z.string().optional(),
      values: z
        .array(z.union([z.string(), z.boolean(), z.number()]))
        .optional(),
      expression_type: z.string().optional(),
      data_type: z.string().optional(),
      input_cvs: z.array(z.unknown()).optional(),
      expressions: z.array(z.any()).optional(),
    }),
    z.null(),
  ]),
  transition_id: z.string(),
});

const stepTypeSchema = z
  .enum([
    "condition",
    "text_message",
    "flamethrower_api_call",
    "go_to_intent",
    "buttons",
    "set_context_variable",
    "dynamic_card",
    "csat_trigger_point",
    "form",
    "sunco_live_chat",
    "zendesk_ticket_creation",
    "unknown",
  ])
  .catch((data) => {
    console.error("Unknown step type:", data);
    return "unknown";
  });

const stepSchema = z.object({
  step_type: stepTypeSchema,
  step_fields: z.object({
    message: z.string().optional(),
    prompt: z.string().optional(),
    url: z.string().optional(),
    method: z.string().optional(),
    intent_workflow_id: z.string().optional(),
    condition_name: z.string().optional(),
  }),
  transitions: z.array(transitionSchema),
  condition_name: z.union([z.string(), z.null()]),
});

export const workflowSchema = z.object({
  canvas: z.object({
    intent_workflow_id: z.string(),
    version: z.number(),
    is_draft: z.boolean(),
    intent_title: z.string(),
    entry_step_id: z.string().nullish(),
    org_id: z.number(),
    step_map: z.record(stepSchema),
  }),
});

export type StepType = z.infer<typeof stepTypeSchema>;
export type WorkflowData = z.infer<typeof workflowSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Transition = z.infer<typeof transitionSchema>;
