import db from '@/components/screening-interview/db';

// Candidate Answers table model and helpers
export function initCandidateAnswersTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS candidate_answers_table (
    answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_type TEXT NOT NULL,
    user_answer TEXT,
    score INTEGER,
    feedback TEXT
  )`).run();
}

export function submitCandidateAnswer(candidateId: number, questionId: number, questionType: string, userAnswer: string) {
  initCandidateAnswersTable();
  // Only one answer per candidate/question
  const exists = db.prepare('SELECT * FROM candidate_answers_table WHERE candidate_id = ? AND question_id = ?').get(candidateId, questionId);
  if (exists) {
    console.log(`[Answers] Candidate ${candidateId} already answered question ${questionId}:`, exists);
    return exists;
  }
  db.prepare(`INSERT INTO candidate_answers_table (candidate_id, question_id, question_type, user_answer) VALUES (?, ?, ?, ?)`)
    .run(candidateId, questionId, questionType, userAnswer);
  const inserted = db.prepare('SELECT * FROM candidate_answers_table WHERE candidate_id = ? AND question_id = ?').get(candidateId, questionId);
  console.log(`[Answers] Candidate ${candidateId} answered question ${questionId}:`, inserted);
  return inserted;
}

export function listAnswersForCandidate(candidateId: number) {
  initCandidateAnswersTable();
  const answers = db.prepare('SELECT * FROM candidate_answers_table WHERE candidate_id = ?').all(candidateId);
  console.log(`[Answers] Listing answers for candidate ${candidateId}:`, answers);
  return answers;
}
