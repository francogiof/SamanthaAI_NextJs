export interface Candidate {
  id: number;
  userId: number; // FK to User
  teamLeaderId?: number; // FK to User (team leader), optional for future linking
  createdAt: string;
}
