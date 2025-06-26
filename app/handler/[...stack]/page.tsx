import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/stack";
import Link from "next/link";

export default async function Handler(props: any) {
  // Await cookies() for app dir API compliance
  const cookieStore = await cookies();
  // Await searchParams if it's a promise (Next.js dynamic API)
  const searchParams = props?.searchParams && typeof props.searchParams.then === "function"
    ? await props.searchParams
    : props?.searchParams;
  const stackAuthId = cookieStore.get("stackAuthId")?.value;

  const intent = searchParams?.intent;

  // Centralize post-auth redirect: if Stack Auth signals a successful sign in/up, redirect to /dashboard
  if (searchParams?.event === "sign-in" || searchParams?.event === "sign-up") {
    // Only run intent logic after OAuth event
    if (intent && stackAuthId) {
      // Check if user exists in DB
      let userRole: any = null;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/role/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stackAuthId }),
          cache: "no-store",
        });
        if (res.ok) {
          userRole = await res.json();
        }
      } catch {}

      // SIGN IN FLOW
      if (intent === "sign-in") {
        if (!userRole) {
          // User does not exist
          // Log failed sign in attempt (optional analytics)
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[Auth] Failed sign in: user does not exist for stackAuthId ${stackAuthId}`);
          }
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
              <div className="text-2xl font-bold text-red-600 mb-2">User not found</div>
              <div className="text-gray-700 mb-4">No account exists for this sign in. Please sign up to create a new account.</div>
              <Link href={"/handler/sign-up?intent=sign-up"} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Sign up instead</Link>
            </div>
          );
        }
        // User exists, check role and redirect
        if (userRole.role === "candidate") redirect("/dashboard/candidate");
        else if (userRole.role === "team-leader") redirect("/dashboard/team-leader");
        else redirect("/dashboard");
      }

      // SIGN UP FLOW
      if (intent === "sign-up") {
        if (userRole) {
          // User already exists
          // Log failed sign up attempt (optional analytics)
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[Auth] Failed sign up: user already exists for stackAuthId ${stackAuthId}`);
          }
          return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gray-50">
              <div className="text-2xl font-bold text-red-600 mb-2">Account already exists</div>
              <div className="text-gray-700 mb-4">An account with this sign in already exists. Please sign in to continue.</div>
              <Link href={"/handler/sign-in?intent=sign-in"} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Sign in instead</Link>
            </div>
          );
        }
        // User does not exist, create team if needed, then go to role selection
        try {
          const user = await stackServerApp.getUser(stackAuthId);
          if (user) {
            const teams = await user.listTeams();
            if (teams.length === 0) {
              await user.createTeam({ displayName: "My Team" });
            }
          }
        } catch (err) {
          // Log but do not block onboarding
          console.error("[Handler] Error ensuring team for user", err);
        }
        redirect("/select-role");
      }
    }
  }

  // Fallback for legacy, or direct access
  if (stackAuthId) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/role/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stackAuthId }),
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
