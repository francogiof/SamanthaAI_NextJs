import { NextRequest, NextResponse } from 'next/server';
import { upsertUserRole } from '@/lib/models/userRole';

export async function POST(req: NextRequest) {
  try {
    const { stackAuthId, role } = await req.json();
    if (!stackAuthId || !role || !['candidate', 'team-leader'].includes(role)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    upsertUserRole(stackAuthId, role);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
