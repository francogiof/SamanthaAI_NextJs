import db from '../db';

export type CandidateTeamLeader = {
  id: number;
  candidateStackAuthId: string;
  teamLeaderStackAuthId: string;
};

export function initCandidateTeamLeaderTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS candidate_team_leader (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidateStackAuthId TEXT NOT NULL,
    teamLeaderStackAuthId TEXT NOT NULL
  )`).run();
}

export function linkCandidateToTeamLeader(candidateStackAuthId: string, teamLeaderStackAuthId: string) {
  initCandidateTeamLeaderTable();
  db.prepare(`INSERT INTO candidate_team_leader (candidateStackAuthId, teamLeaderStackAuthId) VALUES (?, ?)`)
    .run(candidateStackAuthId, teamLeaderStackAuthId);
}

export function getCandidatesForTeamLeader(teamLeaderStackAuthId: string): CandidateTeamLeader[] {
  initCandidateTeamLeaderTable();
  return db.prepare('SELECT * FROM candidate_team_leader WHERE teamLeaderStackAuthId = ?')
    .all(teamLeaderStackAuthId);
}
