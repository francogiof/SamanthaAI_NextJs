import { cookies } from 'next/headers';
import { parseSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default function TeamLeaderDashboardLayout({ children }: { children: React.ReactNode }) {
  // Server-side session check
  const session = cookies().get('session')?.value;
  const parsed = session ? parseSession(session) : null;
  if (!parsed) {
    redirect('/signin');
  }
  if (parsed.role !== 'team-leader') {
    redirect('/dashboard/candidate');
  }
  return <>{children}</>;
}
