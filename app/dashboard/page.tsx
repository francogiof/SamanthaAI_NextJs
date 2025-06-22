import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const stackAuthId = cookieStore.get('stackAuthId')?.value;

  if (!stackAuthId) {
    // Show a loading spinner if cookie is missing (likely just signed in)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/role/get`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stackAuthId }),
    cache: 'no-store',
  });
  if (res.ok) {
    const data = await res.json();
    if (data.role === 'candidate') redirect('/dashboard/candidate');
    else if (data.role === 'team-leader') redirect('/dashboard/team-leader');
    else redirect('/select-role');
  } else {
    redirect('/select-role');
  }

  return null;
}
