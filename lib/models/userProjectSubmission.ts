import db from '../db';
import { getScoresForCandidate } from '@/lib/models/scores';

// User Project Submission table model and helpers
export function initUserProjectSubmissionTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS user_project_submission_table (
    submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    requirement_id INTEGER NOT NULL,
    submission_link TEXT,
    evaluation_score INTEGER,
    evaluator_feedback TEXT,
    submitted_at TEXT
  )`).run();
}

export function submitProject(candidateId: number, requirementId: number, submissionLink: string) {
  initUserProjectSubmissionTable();
  // Only one submission per candidate/requirement
  const exists = db.prepare('SELECT * FROM user_project_submission_table WHERE candidate_id = ? AND requirement_id = ?').get(candidateId, requirementId);
  if (exists) {
    console.log(`[ProjectSubmission] Candidate ${candidateId} already submitted for requirement ${requirementId}`);
    return exists;
  }
  const submittedAt = new Date().toISOString();
  db.prepare(`INSERT INTO user_project_submission_table (candidate_id, requirement_id, submission_link, submitted_at) VALUES (?, ?, ?, ?)`)
    .run(candidateId, requirementId, submissionLink, submittedAt);
  const inserted = db.prepare('SELECT * FROM user_project_submission_table WHERE candidate_id = ? AND requirement_id = ?').get(candidateId, requirementId);
  console.log(`[ProjectSubmission] Candidate ${candidateId} submitted project for requirement ${requirementId}:`, inserted);
  return inserted;
}

export function listSubmissionsForCandidate(candidateId: number) {
  initUserProjectSubmissionTable();
  const submissions = db.prepare('SELECT * FROM user_project_submission_table WHERE candidate_id = ?').all(candidateId);
  console.log(`[ProjectSubmission] Listing submissions for candidate ${candidateId}:`, submissions);
  return submissions;
}

export function updateSubmissionScore(submissionId: number, score: number, feedback: string) {
  initUserProjectSubmissionTable();
  db.prepare('UPDATE user_project_submission_table SET evaluation_score = ?, evaluator_feedback = ? WHERE submission_id = ?')
    .run(score, feedback, submissionId);
  const updated = db.prepare('SELECT * FROM user_project_submission_table WHERE submission_id = ?').get(submissionId);
  console.log(`[ProjectSubmission] Updated score/feedback for submission ${submissionId}:`, updated);
  return updated;
}

export function canSubmitProject(candidateId: number, minScore: number = 60) {
  // Check if candidate's technical and behavioral scores are above threshold
  const scores: any = getScoresForCandidate(candidateId);
  if (!scores) {
    console.log(`[Progression] No scores found for candidate ${candidateId}`);
    return false;
  }
  const technical = scores.technical_score || 0;
  const behavioral = scores.behavioral_score || 0;
  const passed = technical >= minScore && behavioral >= minScore;
  console.log(`[Progression] Candidate ${candidateId} can submit project:`, passed, scores);
  return passed;
}
