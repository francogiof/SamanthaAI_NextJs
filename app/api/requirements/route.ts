import { NextRequest, NextResponse } from 'next/server';
import { listRequirements } from '@/lib/models/requirements';
import db from '@/lib/db';

export async function GET() {
  try {
    const requirements = listRequirements();
    return NextResponse.json({ requirements });
  } catch (error) {
    console.log('[API/requirements] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { creator_user_id, creator_role, role_name, responsibilities, required_skills, experience_required_years } = await req.json();
    if (!creator_user_id || !creator_role || !role_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    db.prepare(`INSERT INTO requirements_table (creator_user_id, creator_role, role_name, responsibilities, required_skills, experience_required_years) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(creator_user_id, creator_role, role_name, responsibilities || '', required_skills || '', experience_required_years || 0);
    const requirement = db.prepare('SELECT * FROM requirements_table WHERE rowid = last_insert_rowid()').get();
    console.log('[API/requirements] Created requirement:', requirement);
    return NextResponse.json({ requirement });
  } catch (error) {
    console.log('[API/requirements] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
