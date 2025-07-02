import db from '../db';

// Candidate Assignments table model and helpers
export function initCandidateAssignmentsTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS candidate_assignments_table (
    assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_at TEXT NOT NULL,
    status TEXT NOT NULL
  )`).run();
}

export function assignRequirementToCandidate(requirementId: number, candidateId: number, assignedBy: number) {
  initCandidateAssignmentsTable();
  // Only assign if not already assigned
  const exists = db.prepare('SELECT * FROM candidate_assignments_table WHERE requirement_id = ? AND candidate_id = ?').get(requirementId, candidateId);
  if (exists) {
    console.log(`[Assignment] Requirement ${requirementId} already assigned to candidate ${candidateId}`);
    return exists;
  }
  const assignedAt = new Date().toISOString();
  db.prepare(`INSERT INTO candidate_assignments_table (requirement_id, candidate_id, assigned_by, assigned_at, status) VALUES (?, ?, ?, ?, 'assigned')`).run(requirementId, candidateId, assignedBy, assignedAt);
  console.log(`[Assignment] Assigned requirement ${requirementId} to candidate ${candidateId}`);
  return db.prepare('SELECT * FROM candidate_assignments_table WHERE requirement_id = ? AND candidate_id = ?').get(requirementId, candidateId);
}

export function listAssignmentsForCandidate(candidateId: number) {
  initCandidateAssignmentsTable();
  return db.prepare('SELECT * FROM candidate_assignments_table WHERE candidate_id = ?').all(candidateId);
}
