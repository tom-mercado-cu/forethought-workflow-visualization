"use server";

import {
  contextVariablesSchema,
  WorkflowData,
  workflowSchema,
} from "@/lib/types";
import { chromium } from "playwright";
import { unstable_cache } from "next/cache";
import { writeFileSync } from "fs";
import { join } from "path";

async function getForethoughtAuthInternal() {
  const forethoughtUrl = process.env.FORETHOUGHT_URL;
  const email = process.env.FORETHOUGHT_EMAIL;
  const password = process.env.FORETHOUGHT_PASSWORD;

  if (!forethoughtUrl || !email || !password) {
    console.error("Missing required environment variables:");
    console.error("FORETHOUGHT_URL:", forethoughtUrl ? "✓" : "✗");
    console.error("FORETHOUGHT_EMAIL:", email ? "✓" : "✗");
    console.error("FORETHOUGHT_PASSWORD:", password ? "✓" : "✗");
    return null;
  }

  let authorizationHeader: string | null = null;

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set up request interception to capture the Authorization header
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("dashboard-api.forethought.ai/looker-embed/settings")) {
        const authHeader = request.headers()["authorization"];
        if (authHeader) {
          authorizationHeader = authHeader;
          console.log("Found Authorization header:", authHeader);
        }
      }
    });

    // Navigate to Forethought
    console.log("Navigating to:", forethoughtUrl);
    await page.goto(forethoughtUrl, { waitUntil: "networkidle" });

    // Wait a bit for the page to load
    await page.waitForTimeout(2000);

    // Try to find and fill the email field
    const emailSelector =
      'input[type="email"], input[name="email"], input[id*="email"]';
    const emailInput = await page.$(emailSelector);
    if (emailInput) {
      await emailInput.fill(email);
      console.log("Email filled");
    } else {
      console.log("Email input not found, trying alternative selectors...");
      // Try more generic selectors
      const allInputs = await page.$$("input");
      for (const input of allInputs) {
        const type = await input.getAttribute("type");
        const name = await input.getAttribute("name");
        if (type === "email" || name?.toLowerCase().includes("email")) {
          await input.fill(email);
          console.log("Email filled using alternative selector");
          break;
        }
      }
    }

    // Try to find and fill the password field
    const passwordSelector =
      'input[type="password"], input[name="password"], input[id*="password"]';
    const passwordInput = await page.$(passwordSelector);
    if (passwordInput) {
      await passwordInput.fill(password);
      console.log("Password filled");
    } else {
      console.log("Password input not found, trying alternative selectors...");
      const allInputs = await page.$$("input[type='password']");
      if (allInputs.length > 0) {
        await allInputs[0].fill(password);
        console.log("Password filled using alternative selector");
      }
    }

    // Try to find and click the submit/login button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'input[type="submit"]',
      '[role="button"]:has-text("Log")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log("Clicked submit button with selector:", selector);
          submitted = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    if (!submitted) {
      // Try pressing Enter on the password field
      const passwordField = await page.$('input[type="password"]');
      if (passwordField) {
        await passwordField.press("Enter");
        console.log("Pressed Enter on password field");
      }
    }

    // Wait for navigation and network requests
    console.log("Waiting for network requests...");
    await page.waitForTimeout(5000);

    // Try to trigger the API call by navigating or interacting
    // Sometimes the API call happens after login, so we wait a bit more
    let attempts = 0;
    while (!authorizationHeader && attempts < 10) {
      await page.waitForTimeout(2000);
      attempts++;
      console.log(`Waiting for API call... attempt ${attempts}/10`);
    }

    await browser.close();

    if (authorizationHeader) {
      console.log("✓ Successfully extracted Authorization header");
      return authorizationHeader;
    } else {
      console.log("✗ Authorization header not found in intercepted requests");
      return null;
    }
  } catch (error) {
    console.error("Error extracting Authorization header:", error);
    return null;
  }
}

const getForethoughtAuth = unstable_cache(
  async () => {
    return await getForethoughtAuthInternal();
  },
  ["forethought-auth"],
  {
    revalidate: 300, // 5 minutos
  }
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

export async function getWorkflow(
  workflowId: string,
  { includeWorkflowNames = true }
): Promise<WorkflowData & { workflowNames: Record<string, string> }> {
  const bearerToken = await getForethoughtAuth();

  if (!bearerToken) {
    throw new Error("Failed to get token");
  }

  const response = await fetch(
    `https://dashboard-api.forethought.ai/dashboard-controls/solve/v2/workflow-builder/${workflowId}`,
    {
      headers: {
        authorization: bearerToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get workflow: ${response.statusText}`);
  }

  const data = workflowSchema.parse(await response.json());

  if (
    process.env.NODE_ENV === "development" &&
    process.env.SAVE_EXAMPLE_RESPONSES === "true"
  ) {
    writeFileSync(
      join(process.cwd(), `examples/${workflowId}-sample-response.json`),
      JSON.stringify(data, null, 2)
    );
  }

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
  const bearerToken = await getForethoughtAuth();

  if (!bearerToken) {
    throw new Error("Failed to get token");
  }

  const response = await fetch(
    `https://dashboard-api.forethought.ai/dashboard-controls/solve/v2/workflow-builder/context-variables`,
    {
      headers: {
        authorization: bearerToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get context variables: ${response.statusText}`);
  }

  const data = contextVariablesSchema.parse(await response.json());

  if (
    process.env.NODE_ENV === "development" &&
    process.env.SAVE_EXAMPLE_RESPONSES === "true"
  ) {
    writeFileSync(
      join(process.cwd(), `examples/context-variables-sample-response.json`),
      JSON.stringify(data, null, 2)
    );
  }

  return data;
}
