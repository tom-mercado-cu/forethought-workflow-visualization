"use client";

import { login } from "@/app/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const [, formAction, pending] = useActionState(
    async (_: void | null, formData: FormData) => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      try {
        await login({ email, password });
      } catch (error) {
        console.error("Error logging in:", error);
        toast.error("Failed to log in");
      }
      return null;
    },
    null
  );

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
