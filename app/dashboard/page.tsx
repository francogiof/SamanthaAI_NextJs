import { cookies } from "next/headers";
import { parseSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - Stack Template",
};

export default async function DashboardPage() {
  // Server-side session check
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const parsed = session ? parseSession(session) : null;
  if (!parsed) {
    redirect("/signin");
  }
  // If role is candidate, redirect to candidate dashboard
  if (parsed.role === "candidate") {
    redirect("/dashboard/candidate");
  }
  // If role is team-leader, redirect to team-leader dashboard
  if (parsed.role === "team-leader") {
    redirect("/dashboard/team-leader");
  }
  // Fallback
  return null;
}
