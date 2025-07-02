import db from '../db';

// QA table model and helpers
export function initQATable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS QA_table (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    ideal_answer TEXT
  )`).run();
}

export function listQuestionsForRequirement(requirementId: number) {
  initQATable();
  return db.prepare('SELECT * FROM QA_table WHERE requirement_id = ?').all(requirementId);
}

export function getQuestionById(questionId: number) {
  initQATable();
  return db.prepare('SELECT * FROM QA_table WHERE question_id = ?').get(questionId);
}
