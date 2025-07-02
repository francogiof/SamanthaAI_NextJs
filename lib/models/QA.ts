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
  const questions = db.prepare('SELECT * FROM QA_table WHERE requirement_id = ?').all(requirementId);
  console.log(`[QA] Listing questions for requirement ${requirementId}:`, questions);
  return questions;
}

export function getQuestionById(questionId: number) {
  initQATable();
  const question = db.prepare('SELECT * FROM QA_table WHERE question_id = ?').get(questionId);
  console.log(`[QA] Get question by id ${questionId}:`, question);
  return question;
}
