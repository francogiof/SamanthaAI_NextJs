import bcrypt from 'bcryptjs';
import type { UserRole } from './models/user';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Simple session (for MVP, use a signed cookie or JWT in production)
export function createSession(userId: number, role: UserRole): string {
  // For MVP, just return a base64 string (not secure for production)
  return Buffer.from(`${userId}:${role}`).toString('base64');
}

export function parseSession(session: string): { userId: number; role: UserRole } | null {
  try {
    const [userId, role] = Buffer.from(session, 'base64').toString().split(':');
    if ((role === 'candidate' || role === 'team-leader') && !isNaN(Number(userId))) {
      return { userId: Number(userId), role: role as UserRole };
    }
    return null;
  } catch {
    return null;
  }
}

// Role check helper
export function isRole(userRole: UserRole, required: UserRole): boolean {
  return userRole === required;
}

// --- TESTS ---
async function testAuthHelpers() {
  const password = 'test1234';
  const hash = await hashPassword(password);
  const valid = await verifyPassword(password, hash);
  const invalid = await verifyPassword('wrong', hash);
  const session = createSession(42, 'candidate');
  const parsed = parseSession(session);
  console.log('Hash valid:', valid); // true
  console.log('Hash invalid:', invalid); // false
  console.log('Session:', session);
  console.log('Parsed:', parsed);
  console.log('Role check:', isRole(parsed?.role || 'candidate', 'candidate'));
}

if (require.main === module) {
  testAuthHelpers();
}
