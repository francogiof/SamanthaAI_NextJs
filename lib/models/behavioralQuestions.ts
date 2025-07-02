import db from '../db';

// Behavioral Questions table model and helpers
export function initBehavioralQuestionsTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS behavioral_questions_table (
    behavioral_question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    ideal_traits TEXT
  )`).run();
}

export function listBehavioralQuestionsForRequirement(requirementId: number) {
  initBehavioralQuestionsTable();
  const questions = db.prepare('SELECT * FROM behavioral_questions_table WHERE requirement_id = ?').all(requirementId);
  console.log(`[BehavioralQA] Listing behavioral questions for requirement ${requirementId}:`, questions);
  return questions;
}

export function getBehavioralQuestionById(behavioralQuestionId: number) {
  initBehavioralQuestionsTable();
  const question = db.prepare('SELECT * FROM behavioral_questions_table WHERE behavioral_question_id = ?').get(behavioralQuestionId);
  console.log(`[BehavioralQA] Get behavioral question by id ${behavioralQuestionId}:`, question);
  return question;
}
