import { redirect } from "next/navigation";
import { isAuthenticated } from "../api/auth";

export default async function CatchAllPage() {
  if (await isAuthenticated()) {
    redirect("/");
  } else {
    redirect("/login");
  }
}
