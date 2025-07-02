import { getUserRole } from './userRole';
import { createCandidateProfile } from './candidate';
import { createTeamLeaderProfile } from './teamLeader';

/**
 * Ensures that a candidate or team leader profile exists for the user, based on their role.
 * Idempotent: will not create duplicate profiles.
 * @param userId - The numeric user_id (from user_roles/candidate_table/team_leader_table)
 * @param stackAuthId - The Stack Auth ID (from user_roles)
 * @returns The created or existing profile, or null if no action taken
 */
export function autoCreateProfileForRole(userId: number, stackAuthId: string) {
  const userRole = getUserRole(stackAuthId);
  if (!userRole) return null;
  if (userRole.role === 'candidate') {
    return createCandidateProfile(userId);
  } else if (userRole.role === 'team-leader') {
    return createTeamLeaderProfile(userId);
  }
  return null;
}
