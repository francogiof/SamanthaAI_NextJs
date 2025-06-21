import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import type { User } from '@/lib/models/user';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = db.prepare('SELECT id, email, role, teamLeaderId, createdAt FROM users WHERE id = ?').get(params.id) as User | undefined;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ user });
}
