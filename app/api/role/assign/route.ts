import { NextRequest, NextResponse } from 'next/server';
import { upsertUserRole, getUserRole } from '@/lib/models/userRole';
import { autoCreateProfileForRole } from '@/lib/models/profileAutoCreate';
import db from '@/lib/db';

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
    // Get the user_id from user_roles (for sub-profile creation)
    const userRole = getUserRole(stackAuthId);
    let userId = null;
    if (userRole) {
      // Try to get user_id from user_roles table (CSV and DB must match)
      // If not present, fallback to finding in candidate_table or team_leader_table
      const row: any = db.prepare('SELECT * FROM user_roles WHERE stackAuthId = ?').get(stackAuthId);
      if (row && typeof row === 'object') {
        if ('user_id' in row) userId = row.user_id;
        else if ('id' in row) userId = row.id;
        else userId = null;
      }
      if (userId) {
        const result = autoCreateProfileForRole(userId, stackAuthId);
        console.log('[RoleAssign] Auto-created sub-profile:', result);
      } else {
        console.log('[RoleAssign] Could not find user_id for stackAuthId', stackAuthId, 'row:', row);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log('[API/role/assign] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
