import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack';

export default async function DashboardPage() {
  // Use Stack Auth SDK to get the user from current context (no args)
  const user = await stackServerApp.getUser();
  if (!user) {
    // Show a loading spinner if user is not found (likely just signed in)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  // Ensure user has a team (Stack Auth requirement)
  try {
    const teams = await user.listTeams();
    if (teams.length === 0) {
      // Create a team for the user (invisible, generic name)
      await user.createTeam({ displayName: 'My Team' });
    }
  } catch (err) {
    // Log but do not block onboarding
    console.error('[DASHBOARD] Error ensuring team for user', err);
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/role/get`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stackAuthId: user.id }),
        cache: 'no-store',
      }
    );
    if (res.status === 404) {
      redirect('/select-role');
    }
    if (res.ok) {
      const data = await res.json();
      if (data.role === 'candidate') redirect('/dashboard/candidate');
      else if (data.role === 'team-leader') redirect('/dashboard/team-leader');
      else redirect('/select-role');
    } else {
      redirect('/select-role');
    }
  } catch (err) {
    redirect('/select-role');
  }

  return null;
}
