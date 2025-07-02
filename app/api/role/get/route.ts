import { NextRequest, NextResponse } from 'next/server';
import { autoCreateProfileForRole } from '@/lib/models/profileAutoCreate';
import { getUserRole } from '@/lib/models/userRole';

export async function POST(req: NextRequest) {
  try {
    const { stackAuthId } = await req.json();
    console.log('[API/role/get] POST stackAuthId:', stackAuthId);
    if (!stackAuthId) {
      console.error('Missing stackAuthId in POST /api/role/get');
      return NextResponse.json({ error: 'Missing stackAuthId' }, { status: 400 });
    }
    const userRole = getUserRole(stackAuthId);
    console.log('[API/role/get] POST userRole:', userRole);
    if (!userRole) {
      console.error('Role not found for stackAuthId:', stackAuthId);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    // Find user_id from user_roles table
    const db = require('@/lib/db').default;
    const userRow = db.prepare('SELECT id FROM user_roles WHERE stackAuthId = ?').get(stackAuthId);
    if (userRow && userRow.id) {
      autoCreateProfileForRole(userRow.id, stackAuthId);
    }
    return NextResponse.json({ role: userRole.role });
  } catch (error) {
    console.error('Server error in POST /api/role/get:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stackAuthId = searchParams.get('stackAuthId');
    console.log('[API/role/get] GET stackAuthId:', stackAuthId);
    if (!stackAuthId) {
      console.error('Missing stackAuthId in GET /api/role/get');
      return NextResponse.json({ error: 'Missing stackAuthId' }, { status: 400 });
    }
    const userRole = getUserRole(stackAuthId);
    console.log('[API/role/get] GET userRole:', userRole);
    if (!userRole) {
      console.error('Role not found for stackAuthId:', stackAuthId);
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    return NextResponse.json({ role: userRole.role });
  } catch (error) {
    console.error('Server error in GET /api/role/get:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
