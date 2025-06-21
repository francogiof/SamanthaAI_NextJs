export type UserRole = 'candidate' | 'team-leader';

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  teamLeaderId?: number; // Optional: FK to User (team leader) for future linking
}
