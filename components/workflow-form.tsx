"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

export function WorkflowForm() {
  const router = useRouter();
  const [, handleSubmit, pending] = useActionState(
    async (_: void | null, formData: FormData) => {
      const workflowId = formData.get("workflowId") as string;
      router.push(`/workflows/${workflowId}`);
      return null;
    },
    null
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Workflow Visualizer</CardTitle>
        <CardDescription>
          Enter workflow ID to visualize your chatbot flow as an interactive
          decision tree
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflowId">Workflow ID</Label>
            <Input
              id="workflowId"
              name="workflowId"
              placeholder="e.g., 12345678-abcd-1234-abcd-123456789012"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Load Workflow"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
