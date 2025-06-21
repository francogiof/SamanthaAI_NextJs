import { NextRequest, NextResponse } from 'next/server';
import db, { initUserTable } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import type { UserRole } from '@/lib/models/user';

initUserTable();

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (role !== 'candidate' && role !== 'team-leader') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    // Check for duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const stmt = db.prepare('INSERT INTO users (email, passwordHash, role) VALUES (?, ?, ?)');
    const info = stmt.run(email, passwordHash, role as UserRole);
    return NextResponse.json({ success: true, userId: info.lastInsertRowid });
  } catch (err) {
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
