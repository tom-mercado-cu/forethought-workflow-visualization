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
    "article_suggestion",
    "restart_conversation",
    "unknown",
  ])
  .catch((data) => {
    console.error("Unknown step type:", data);
    return "unknown";
  });

const stepSchema = z.object({
  step_type: stepTypeSchema,
  step_fields: z
    .object({
      message: z.string().optional(),
      prompt: z.string().optional(),
      url: z.string().optional(),
      method: z.string().optional(),
      intent_workflow_id: z.string().optional(),
      condition_name: z.string().optional(),
    })
    .passthrough(), // Allow additional fields
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

const contextVariableItemSchema = z
  .object({
    context_variable_type: z.string().optional(),
    context_variable_name: z.string(),
    context_variable_id: z.string(),
    is_universal_context_variable: z.boolean().optional(),
    created_date: z.string().nullable().optional(),
    is_workflow_context: z.boolean().optional(),
    list_type_options: z.array(z.unknown()).nullable().optional(),
    configuration_fields: z.unknown().optional(),
    is_system_context_variable: z.boolean().optional(),
    default_value: z.unknown().optional(),
    is_private_context_variable: z.boolean().optional(),
  })
  .passthrough();

export const contextVariablesSchema = z.object({
  context_variables: z.array(contextVariableItemSchema),
  template_context_variables: z.array(contextVariableItemSchema),
  usable_system_context_variables: z.array(contextVariableItemSchema),
  runtime_system_context_variables: z.array(z.unknown()),
});

export type ContextVariables = z.infer<typeof contextVariablesSchema>;

export const intentsSchema = z
  .object({
    intents: z
      .array(
        z.union([
          z.object({
            intent_definition_id: z.string(),
            intent_workflow_id: z.string(),
            intent_name: z.string(),
            active_workflow_types: z.array(z.string()),
            channels: z.array(z.string()),
            inquiry_count_per_channel: z.object({
              email: z.number(),
              widget: z.number(),
              api: z.number(),
              slack: z.number(),
              playbook: z.number(),
            }),
            is_autoflow: z.boolean(),
            is_handoff: z.boolean(),
            is_default_handoff: z.boolean(),
            interactive_email_workflow_id: z.string(),
            api_workflow_id: z.string(),
            api_workflow_is_autoflow: z.boolean(),
            api_is_handoff: z.boolean(),
            api_is_default_handoff: z.boolean(),
            interactive_email_workflow_is_autoflow: z.boolean(),
            slack_workflow_id: z.string(),
            slack_workflow_is_autoflow: z.boolean(),
            slack_is_handoff: z.boolean(),
            slack_is_default_handoff: z.boolean(),
            email_autopilot_enabled: z.boolean(),
            email_human_in_the_loop_enabled: z.boolean(),
            is_all_tags: z.boolean(),
            workflow_tags: z.array(z.unknown()),
            subflow_type: z.null(),
          }),
          z.object({
            intent_definition_id: z.string(),
            intent_workflow_id: z.string(),
            intent_name: z.string(),
            active_workflow_types: z.array(z.string()),
            channels: z.array(z.string()),
            inquiry_count_per_channel: z.object({
              email: z.number(),
              widget: z.number(),
              api: z.number(),
              slack: z.number(),
              playbook: z.number(),
            }),
            is_autoflow: z.boolean(),
            is_handoff: z.boolean(),
            is_default_handoff: z.boolean(),
            interactive_email_workflow_id: z.string(),
            api_workflow_id: z.string(),
            api_workflow_is_autoflow: z.boolean(),
            api_is_handoff: z.boolean(),
            api_is_default_handoff: z.boolean(),
            interactive_email_workflow_is_autoflow: z.boolean(),
            slack_workflow_id: z.string(),
            slack_workflow_is_autoflow: z.boolean(),
            slack_is_handoff: z.boolean(),
            slack_is_default_handoff: z.boolean(),
            email_autopilot_enabled: z.boolean(),
            email_human_in_the_loop_enabled: z.boolean(),
            is_all_tags: z.boolean(),
            workflow_tags: z.array(z.string()),
            subflow_type: z.null(),
          }),
          z.object({
            intent_definition_id: z.string(),
            intent_workflow_id: z.string(),
            intent_name: z.string(),
            active_workflow_types: z.array(z.unknown()),
            channels: z.array(z.string()),
            inquiry_count_per_channel: z.object({
              email: z.number(),
              widget: z.number(),
              api: z.number(),
              slack: z.number(),
              playbook: z.number(),
            }),
            is_autoflow: z.boolean(),
            is_handoff: z.boolean(),
            is_default_handoff: z.boolean(),
            interactive_email_workflow_id: z.string(),
            api_workflow_id: z.string(),
            api_workflow_is_autoflow: z.boolean(),
            api_is_handoff: z.boolean(),
            api_is_default_handoff: z.boolean(),
            interactive_email_workflow_is_autoflow: z.boolean(),
            slack_workflow_id: z.string(),
            slack_workflow_is_autoflow: z.boolean(),
            slack_is_handoff: z.boolean(),
            slack_is_default_handoff: z.boolean(),
            email_autopilot_enabled: z.boolean(),
            email_human_in_the_loop_enabled: z.boolean(),
            is_all_tags: z.boolean(),
            workflow_tags: z.array(z.string()),
            subflow_type: z.null(),
          }),
          z.object({
            intent_definition_id: z.string(),
            intent_workflow_id: z.string(),
            intent_name: z.string(),
            active_workflow_types: z.array(z.unknown()),
            channels: z.array(z.string()),
            inquiry_count_per_channel: z.object({
              email: z.number(),
              widget: z.number(),
              api: z.number(),
              slack: z.number(),
              playbook: z.number(),
            }),
            is_autoflow: z.boolean(),
            is_handoff: z.boolean(),
            is_default_handoff: z.boolean(),
            interactive_email_workflow_id: z.string(),
            api_workflow_id: z.string(),
            api_workflow_is_autoflow: z.boolean(),
            api_is_handoff: z.boolean(),
            api_is_default_handoff: z.boolean(),
            interactive_email_workflow_is_autoflow: z.boolean(),
            slack_workflow_id: z.string(),
            slack_workflow_is_autoflow: z.boolean(),
            slack_is_handoff: z.boolean(),
            slack_is_default_handoff: z.boolean(),
            email_autopilot_enabled: z.boolean(),
            email_human_in_the_loop_enabled: z.boolean(),
            is_all_tags: z.boolean(),
            workflow_tags: z.array(z.unknown()),
            subflow_type: z.null(),
          }),
        ])
      )
      .nullish(),
  })
  .transform((data) => {
    return data.intents?.filter((intent) => intent.is_autoflow === false) ?? [];
  });

export type Intents = z.infer<typeof intentsSchema>;
