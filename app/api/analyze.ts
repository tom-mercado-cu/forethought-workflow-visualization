"use server";

import OpenAI from "openai";
import { z } from "zod";
import type { Transition, WorkflowData } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SplitPoint = {
  stepId: string;
  qaTransitionStepId: string;
  prodTransitionStepId: string;
  conditionName: string;
};

type StepSummary = {
  id: string;
  step_type: string;
  label: string;
  url?: string;
  method?: string;
  message?: string;
};

export type WorkflowIssue = {
  severity: "error" | "warning" | "info";
  title: string;
  description: string;
  fix: string;
  splitCondition: string;
  nodeIds: string[];
};

// ─── Zod validation for OpenAI response ──────────────────────────────────────

const workflowIssueSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  title: z.string(),
  description: z.string(),
  fix: z.string(),
  splitCondition: z.string(),
  nodeIds: z.array(z.string()),
});

const openAIResponseSchema = z.object({
  issues: z.array(workflowIssueSchema),
});

// ─── Keyword patterns ─────────────────────────────────────────────────────────

const QA_KEYWORDS = /\b(qa|staging|sandbox|development)\b/i;
const PROD_KEYWORDS = /\b(prod|production|live)\b/i;
const ENV_FIELD_PATTERN = /environment|env|is_prod|is_qa/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStepLabel(step: WorkflowData["canvas"]["step_map"][string]): string {
  return (
    step.condition_name ||
    step.step_fields.condition_name ||
    step.step_fields.message?.slice(0, 60) ||
    step.step_fields.url?.slice(0, 60) ||
    step.step_type
  );
}

function classifyExpressionEnv(
  expr: Transition["condition_expression"]
): "qa" | "prod" | null {
  if (!expr) return null;

  const checkValue = (v: unknown): "qa" | "prod" | null => {
    const s = String(v);
    if (QA_KEYWORDS.test(s)) return "qa";
    if (PROD_KEYWORDS.test(s)) return "prod";
    return null;
  };

  // Check if field name is env-related, then check values
  if (expr.field && ENV_FIELD_PATTERN.test(expr.field)) {
    if (expr.values) {
      for (const v of expr.values) {
        const match = checkValue(v);
        if (match) return match;
      }
    }
  }

  // Check values directly regardless of field
  if (expr.values) {
    for (const v of expr.values) {
      const match = checkValue(v);
      if (match) return match;
    }
  }

  return null;
}

// ─── QA/PROD Split Detection ──────────────────────────────────────────────────

function detectSplitPoints(
  stepMap: WorkflowData["canvas"]["step_map"]
): SplitPoint[] {
  const splits: SplitPoint[] = [];

  for (const [stepId, step] of Object.entries(stepMap)) {
    if (step.step_type !== "condition") continue;
    if (step.transitions.length < 2) continue;

    const conditionName =
      step.condition_name || step.step_fields.condition_name || "";


    let qaStepId: string | null = null;
    let prodStepId: string | null = null;
    let elseStepId: string | null = null;

    for (const t of step.transitions) {
      if (!t.condition_expression) {
        elseStepId = t.step_id;
        continue;
      }
      const env = classifyExpressionEnv(t.condition_expression);
      if (env === "qa" && !qaStepId) qaStepId = t.step_id;
      if (env === "prod" && !prodStepId) prodStepId = t.step_id;
    }

    // Assign the else branch to whichever side is missing
    if (qaStepId && !prodStepId && elseStepId) prodStepId = elseStepId;
    if (!qaStepId && prodStepId && elseStepId) qaStepId = elseStepId;

    // If condition label itself signals an env split (e.g. "Is Production?" / "Is QA?")
    if (!qaStepId || !prodStepId) {
      const nameSignalsProd = PROD_KEYWORDS.test(conditionName);
      const nameSignalsQa = QA_KEYWORDS.test(conditionName);

      if ((nameSignalsProd || nameSignalsQa) && elseStepId) {
        const nonNullTransitions = step.transitions.filter(
          (t) => t.condition_expression !== null
        );
        if (nonNullTransitions.length >= 1) {
          const nonNullStepId = nonNullTransitions[0].step_id;
          if (nameSignalsProd && !prodStepId && !qaStepId) {
            // "Is Production?" → non-null branch = prod, else = qa
            prodStepId = nonNullStepId;
            qaStepId = elseStepId;
          } else if (nameSignalsQa && !prodStepId && !qaStepId) {
            // "Is QA?" → non-null branch = qa, else = prod
            qaStepId = nonNullStepId;
            prodStepId = elseStepId;
          }
        }
      }
    }

    if (!qaStepId || !prodStepId) continue;

    splits.push({
      stepId,
      qaTransitionStepId: qaStepId,
      prodTransitionStepId: prodStepId,
      conditionName: conditionName || `Condition ${stepId}`,
    });
  }

  return splits;
}

// ─── Branch Traversal ─────────────────────────────────────────────────────────

function traverseBranch(
  startStepId: string,
  stepMap: WorkflowData["canvas"]["step_map"]
): StepSummary[] {
  const summaries: StepSummary[] = [];
  const visited = new Set<string>();
  const queue: string[] = [startStepId];

  while (queue.length > 0 && summaries.length < 30) {
    const stepId = queue.shift()!;
    if (visited.has(stepId)) continue;
    visited.add(stepId);

    const step = stepMap[stepId];
    if (!step) continue;

    summaries.push({
      id: stepId,
      step_type: step.step_type,
      label: getStepLabel(step),
      ...(step.step_fields.url && {
        url: step.step_fields.url.slice(0, 150),
      }),
      ...(step.step_fields.method && { method: step.step_fields.method }),
      ...(step.step_fields.message && {
        message: step.step_fields.message.slice(0, 200),
      }),
    });

    for (const t of step.transitions) {
      if (t.step_id && !visited.has(t.step_id)) {
        queue.push(t.step_id);
      }
    }
  }

  return summaries;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function analyzeWorkflow(
  workflow: WorkflowData
): Promise<WorkflowIssue[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const splits = detectSplitPoints(workflow.canvas.step_map);

  if (splits.length === 0) {
    return [
      {
        severity: "info",
        title: "No QA/PROD splits detected",
        description:
          "No condition step that cleanly splits QA vs PROD was detected.",
        fix: "Check that your workflow contains a condition step whose transitions reference QA and PROD environments.",
        splitCondition: "N/A",
        nodeIds: [],
      },
    ];
  }

  const splitPayload = splits.map((split) => ({
    splitCondition: split.conditionName,
    splitStepId: split.stepId,
    qa: traverseBranch(split.qaTransitionStepId, workflow.canvas.step_map),
    prod: traverseBranch(split.prodTransitionStepId, workflow.canvas.step_map),
  }));

  const prompt = `You are a workflow QA analyzer. Forethought AI workflows often contain a condition step that splits into parallel QA and PROD branches. These branches should be structurally identical, differing only in environment-specific hostnames or subdomains (e.g. qa.example.com vs prod.example.com, staging- prefixes).

Analyze the QA vs PROD branch pairs below and identify TRUE inconsistencies.

IGNORE: differences in hostnames, subdomains, or URL segments that vary only by environment label (qa, prod, staging, dev, sandbox). These are expected and not issues.

FLAG as issues:
- Steps present in one branch but missing from the other
- Steps in a different order between branches
- Different step_type at the same position
- Different HTTP method (e.g. GET vs POST) for the same API call
- Materially different message or copy content (beyond env-specific URL differences)
- Missing error handling in one branch vs. the other

DESCRIPTION RULES — this is critical:
- NEVER reference steps by position number (e.g. do NOT say "step at position 3" or "the 5th step")
- ALWAYS identify steps by their actual content: use the step's label, URL path, message text, or step_type
- Good example: "The API call to '/api/v2/orders/edit' uses GET in QA but POST in PROD"
- Good example: "The message 'Your order has been updated' exists in the QA branch but is missing from PROD"
- Good example: "The condition step 'Is order editable?' is present in QA but has no equivalent in PROD"
- Bad example: "Step at position 4 has a different HTTP method" ← never do this

For each issue:
- severity: "error" for structural mismatches, "warning" for suspicious differences, "info" for minor notes
- title: short label (max 10 words) that names the affected step by content, not position
- description: 1-2 sentences using step labels/URLs/messages to clearly explain the problem
- fix: 1-2 sentences of concrete, actionable steps to resolve the issue directly in Forethought. Be specific — reference the exact branch (QA or PROD), the step type, and what needs to be changed, added, or removed. Example: "In Forethought, open the PROD branch and add a 'flamethrower_api_call' step after 'Check Order Status' matching the QA branch configuration. Set the HTTP method to POST to align with QA."
- splitCondition: the conditionName of the split where the issue occurs
- nodeIds: array of step UUIDs (from StepSummary.id fields) involved in the issue

Respond ONLY with valid JSON in this exact shape:
{ "issues": [ { "severity": "...", "title": "...", "description": "...", "fix": "...", "splitCondition": "...", "nodeIds": ["..."] } ] }

If no issues are found, return: { "issues": [] }

Branch data:
${JSON.stringify(splitPayload, null, 2)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let parsed: ReturnType<typeof openAIResponseSchema.safeParse>;
    try {
      parsed = openAIResponseSchema.safeParse(JSON.parse(raw));
    } catch {
      return [
        {
          severity: "warning",
          title: "Analysis failed",
          description: "Failed to parse OpenAI response.",
          fix: "Try running the analysis again.",
          splitCondition: "N/A",
          nodeIds: [],
        },
      ];
    }

    if (!parsed.success) {
      return [
        {
          severity: "warning",
          title: "Analysis failed",
          description: "Failed to parse OpenAI response.",
          fix: "Try running the analysis again.",
          splitCondition: "N/A",
          nodeIds: [],
        },
      ];
    }

    return parsed.data.issues;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return [
      {
        severity: "warning",
        title: "Analysis failed",
        description: message,
        fix: "Try running the analysis again.",
        splitCondition: "N/A",
        nodeIds: [],
      },
    ];
  }
}
