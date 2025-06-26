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

  // --- EARLY INTENT BRANCHING ---
  if (intent === "sign-in") {
    // --- STRICT SIGN IN LOGIC ---
    if (!stackAuthId) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-blue-700 mb-2">Sign In Required</div>
          <div className="text-muted-foreground mb-4">You must be signed in to access your dashboard. Please sign in below.</div>
          <div className="mb-2">
            <StackHandler fullPage app={stackServerApp} routeProps={props} />
          </div>
        </div>
      );
    }
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
    } catch (err) {
      // Defensive: show error if DB check fails
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">Server Error</div>
          <div className="text-muted-foreground mb-4">We couldn&apos;t check your account at this time. Please try again later.</div>
        </div>
      );
    }
    if (!userRole) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Auth] Failed sign in: user does not exist for stackAuthId ${stackAuthId}`);
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">User not found</div>
          <div className="text-muted-foreground mb-4">No account exists for this sign in. Please sign up to create a new account.</div>
          <Link href={"/handler/sign-up?intent=sign-up"} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition">Sign up instead</Link>
        </div>
      );
    }
    // Defensive: check for missing role
    if (!userRole.role) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">Account Issue</div>
          <div className="text-muted-foreground mb-4">Your account is missing a role. Please contact support.</div>
        </div>
      );
    }
    if (userRole.role === "candidate") redirect("/dashboard/candidate");
    else if (userRole.role === "team-leader") redirect("/dashboard/team-leader");
    else redirect("/dashboard");
    return null;
  }

  if (intent === "sign-up") {
    // --- STRICT SIGN UP LOGIC ---
    if (!stackAuthId) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-blue-700 mb-2">Sign Up Required</div>
          <div className="text-muted-foreground mb-4">To create a new account, please sign up below.</div>
          <div className="mb-2">
            <StackHandler fullPage app={stackServerApp} routeProps={props} />
          </div>
        </div>
      );
    }
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
    } catch (err) {
      // Defensive: show error if DB check fails
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">Server Error</div>
          <div className="text-muted-foreground mb-4">We couldn&apos;t check your account at this time. Please try again later.</div>
        </div>
      );
    }
    if (userRole) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[Auth] Failed sign up: user already exists for stackAuthId ${stackAuthId}`);
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">Account already exists</div>
          <div className="text-muted-foreground mb-4">An account with this sign in already exists. Please sign in to continue.</div>
          <Link href={"/handler/sign-in?intent=sign-in"} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition">Sign in instead</Link>
        </div>
      );
    }
    // Defensive: ensure team creation errors are handled
    try {
      const user = await stackServerApp.getUser({ or: "throw" });
      if (user) {
        const teams = await user.listTeams();
        if (teams.length === 0) {
          await user.createTeam({ displayName: "My Team" });
        }
      }
    } catch (err) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-foreground">
          <div className="text-2xl font-bold text-red-600 mb-2">Account Setup Error</div>
          <div className="text-muted-foreground mb-4">We couldn&apos;t finish setting up your account. Please try again or contact support.</div>
        </div>
      );
    }
    redirect("/select-role");
    return null;
  }

  // --- REMOVE SHARED FALLBACKS: Only legacy or direct access below ---
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // If not authenticated, always render StackHandler (shows sign in/up UI)
  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
