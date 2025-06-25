import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";

export default async function Handler(props: any) {
  // Get cookies for server context
  const cookieStore = cookies();
  // Use Stack Auth SDK to get the user from current context (no args)
  const user = await stackServerApp.getUser();
  // Await searchParams if it's a promise (Next.js dynamic API)
  const searchParams = props?.searchParams && typeof props.searchParams.then === "function"
    ? await props.searchParams
    : props?.searchParams;

  // Centralize post-auth redirect: if Stack Auth signals a successful sign in/up, redirect to /dashboard
  if (searchParams?.event === "sign-in" || searchParams?.event === "sign-up") {
    // Backend: ensure user has a team (Stack Auth requirement)
    if (user) {
      try {
        const teams = await user.listTeams();
        if (teams.length === 0) {
          await user.createTeam({ displayName: "My Team" });
        }
      } catch (err) {
        // Log but do not block onboarding
        console.error("[Handler] Error ensuring team for user", err);
      }
    }
    redirect("/dashboard");
  }

  // If authenticated, check role and redirect
  if (user) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/role/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackAuthId: user.id }),
        cache: "no-store",
      });
      if (res.status === 404) {
        redirect("/select-role");
      }
      const data = await res.json();
      if (data?.role === "candidate") {
        redirect("/dashboard/candidate");
      } else if (data?.role === "team-leader") {
        redirect("/dashboard/team-leader");
      } else {
        redirect("/select-role");
      }
    } catch (e) {
      // On error, fallback to select-role
      redirect("/select-role");
    }
    // Show spinner while redirecting (should not be visible)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  // If not authenticated, always render StackHandler (shows sign in/up UI)
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
