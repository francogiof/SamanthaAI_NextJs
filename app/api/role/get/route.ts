import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/models/userRole';

export async function POST(req: NextRequest) {
  try {
    const { stackAuthId } = await req.json();
    if (!stackAuthId) {
      return NextResponse.json({ error: 'Missing stackAuthId' }, { status: 400 });
    }
    const userRole = getUserRole(stackAuthId);
    if (!userRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ role: userRole.role });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stackAuthId = searchParams.get('stackAuthId');
    if (!stackAuthId) {
      return NextResponse.json({ error: 'Missing stackAuthId' }, { status: 400 });
    }
    const userRole = getUserRole(stackAuthId);
    if (!userRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ role: userRole.role });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
