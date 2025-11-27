import { LoginForm } from "@/components/LoginForm";
import { redirect } from "next/navigation";
import { isAuthenticated } from "../api/auth";

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect("/");
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Log in</h2>
        <p className="text-slate-600 mb-6">
          Remember to use your Forethought email and password.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
