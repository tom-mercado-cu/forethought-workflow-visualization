"use client";

import { login } from "@/app/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (
      _: { success: boolean | null; error: Error | null },
      formData: FormData
    ) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      try {
        await login({ email, password });
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: error as Error };
      }
    },
    { success: null, error: null } as {
      success: boolean | null;
      error: Error | null;
    }
  );

  useEffect(() => {
    if (state.success === false) {
      toast.error("Failed to log in");
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="your@email.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <LoaderCircle className="animate-spin" /> : "Log in"}
      </Button>
    </form>
  );
}
