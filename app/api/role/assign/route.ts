import { NextRequest, NextResponse } from 'next/server';
import { upsertUserRole, getUserRole } from '@/lib/models/userRole';

export async function POST(req: NextRequest) {
  try {
    const { stackAuthId, role } = await req.json();
    if (!stackAuthId || !role || !['candidate', 'team-leader'].includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    // Prevent role change if already set
    const existing = getUserRole(stackAuthId);
    if (existing) {
      return NextResponse.json({ error: 'Role already set' }, { status: 409 });
    }
    upsertUserRole(stackAuthId, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
