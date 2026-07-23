import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/session";

export default function Home() {
  const session = getDemoSession();
  redirect(session ? "/dashboard" : "/login");
}
