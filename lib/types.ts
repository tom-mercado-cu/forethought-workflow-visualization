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

export const contextVariablesSchema = z.object({
  context_variables: z.array(
    z.union([
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.string(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  id: z.object({ type: z.string() }),
                  date: z.object({ type: z.string(), format: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(
          z.object({ label: z.string(), value: z.string() })
        ),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.string(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  id: z.object({ type: z.string() }),
                  magentoOrderId: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  shippingDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  createdAt: z.object({ type: z.string(), format: z.string() }),
                  deliveryDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  products: z.object({
                    type: z.string(),
                    items: z.object({
                      type: z.string(),
                      properties: z.object({
                        id: z.object({ type: z.string() }),
                        inventoryId: z.object({ type: z.string() }),
                        name: z.object({ type: z.string() }),
                        quantity: z.object({ type: z.string() }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
            context_variables: z.array(
              z.union([
                z.object({
                  context_variable_name: z.string(),
                  context_variable_id: z.string(),
                  options: z.null(),
                }),
                z.object({
                  context_variable_name: z.string(),
                  context_variable_id: z.null(),
                  options: z.array(z.unknown()),
                }),
              ])
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  deliveryDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  shippingDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  timezone: z.object({ type: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  id: z.object({ type: z.string() }),
                  discountPrice: z.object({ type: z.string() }),
                  mealsPerDelivery: z.object({ type: z.string() }),
                  price: z.object({ type: z.string() }),
                  pricePerMeal: z.object({ type: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(
          z.object({ label: z.string(), value: z.string() })
        ),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.boolean(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  deliveryDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  shippingDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  timezone: z.object({ type: z.string() }),
                  displayDeliveryDateReduced: z.object({ type: z.string() }),
                  displayDeliveryDate: z.object({ type: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  deliveryDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  shippingDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  timezone: z.object({ type: z.string() }),
                  displayDeliveryDateReduced: z.object({ type: z.string() }),
                  displayDeliveryDate: z.object({ type: z.string() }),
                  charged: z.object({ type: z.string() }),
                  hasOrder: z.object({ type: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.string(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(z.unknown()),
        configuration_fields: z.object({
          min_length: z.null(),
          max_length: z.null(),
          is_alphanumeric: z.boolean(),
          dynamic_list_config: z.object({
            json_schema: z.object({
              type: z.string(),
              items: z.object({
                type: z.string(),
                properties: z.object({
                  deliveryDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  shippingDate: z.object({
                    type: z.string(),
                    format: z.string(),
                  }),
                  timezone: z.object({ type: z.string() }),
                  displayDeliveryDateReduced: z.object({ type: z.string() }),
                  displayDeliveryDate: z.object({ type: z.string() }),
                  charged: z.object({ type: z.string() }),
                  chargedStr: z.object({ type: z.string() }),
                  hasOrder: z.object({ type: z.string() }),
                }),
              }),
            }),
            context_variables: z.array(
              z.object({
                context_variable_name: z.string(),
                context_variable_id: z.string(),
                options: z.null(),
              })
            ),
          }),
          dynamic_options_config: z.null(),
        }),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
    ])
  ),
  template_context_variables: z.array(
    z.union([
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.null(),
        is_workflow_context: z.boolean(),
        list_type_options: z.null(),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.null(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(
          z.object({ label: z.string(), value: z.string() })
        ),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
    ])
  ),
  usable_system_context_variables: z.array(
    z.union([
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.null(),
        is_workflow_context: z.boolean(),
        list_type_options: z.null(),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
      z.object({
        context_variable_type: z.string(),
        context_variable_name: z.string(),
        context_variable_id: z.string(),
        is_universal_context_variable: z.boolean(),
        created_date: z.null(),
        is_workflow_context: z.boolean(),
        list_type_options: z.array(
          z.object({ label: z.string(), value: z.string() })
        ),
        configuration_fields: z.null(),
        is_system_context_variable: z.boolean(),
        default_value: z.null(),
        is_private_context_variable: z.boolean(),
      }),
    ])
  ),
  runtime_system_context_variables: z.array(z.unknown()),
});

export type ContextVariables = z.infer<typeof contextVariablesSchema>;
