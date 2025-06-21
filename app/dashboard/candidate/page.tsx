import { cookies } from 'next/headers';
import { parseSession } from '@/lib/auth';
import db from '@/lib/db';

export default async function CandidateDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const parsed = session ? parseSession(session) : null;
  let email = '';
  if (parsed) {
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(parsed.userId);
    email = user?.email || '';
  }
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Candidate Dashboard</h1>
      <p>Welcome! You are logged in as a candidate.</p>
      {email && <p className="mt-2">Email: {email}</p>}
    </div>
  );
}
