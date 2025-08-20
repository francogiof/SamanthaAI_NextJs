-- Database Migration Script for Updated Structure
-- This script updates the database to match the new CSV structure

-- 1. Add company_id column to requirements_table
ALTER TABLE requirements_table ADD COLUMN company_id TEXT;

-- 2. Create company_table
CREATE TABLE IF NOT EXISTS company_table (
    company_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    size TEXT,
    website TEXT,
    location TEXT
);

-- 3. Create screening_questions_table
CREATE TABLE IF NOT EXISTS screening_questions_table (
    screening_question_id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id)
);

-- 4. Create screening_answers_table
CREATE TABLE IF NOT EXISTS screening_answers_table (
    answer_id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    screening_question_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    score TEXT,
    feedback TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidate_table(candidate_id),
    FOREIGN KEY (screening_question_id) REFERENCES screening_questions_table(screening_question_id)
);

-- 5. Create behavioral_answers_table
CREATE TABLE IF NOT EXISTS behavioral_answers_table (
    answer_id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    behavioral_question_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    score TEXT,
    feedback TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidate_table(candidate_id),
    FOREIGN KEY (behavioral_question_id) REFERENCES behavioral_questions_table(behavioral_question_id)
);

-- 6. Create technical_questions_table (replaces qa_table)
CREATE TABLE IF NOT EXISTS technical_questions_table (
    technical_question_id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    question TEXT NOT NULL,
    ideal_answer TEXT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id)
);

-- 7. Create technical_answers_table
CREATE TABLE IF NOT EXISTS technical_answers_table (
    answer_id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    technical_question_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    score TEXT,
    feedback TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidate_table(candidate_id),
    FOREIGN KEY (technical_question_id) REFERENCES technical_questions_table(technical_question_id)
);

-- 8. Create context_requirements_table
CREATE TABLE IF NOT EXISTS context_requirements_table (
    context_id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    salary_range TEXT,
    contract_type TEXT,
    start_date TEXT,
    schedule TEXT,
    extra_notes TEXT,
    exclusion_criteria TEXT,
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id)
);

-- 9. Create candidate_status_table
CREATE TABLE IF NOT EXISTS candidate_status_table (
    status_id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    requirement_id TEXT NOT NULL,
    current_step TEXT NOT NULL,
    status TEXT NOT NULL,
    FOREIGN KEY (candidate_id) REFERENCES candidate_table(candidate_id),
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id)
);

-- 10. Update requirements_table with company_id values
UPDATE requirements_table SET company_id = '1' WHERE requirement_id = '1';
UPDATE requirements_table SET company_id = '2' WHERE requirement_id = '2';

-- 11. Migrate data from qa_table to technical_questions_table
INSERT INTO technical_questions_table (technical_question_id, requirement_id, question, ideal_answer)
SELECT 
    'tq_' || question_id,
    requirement_id,
    question,
    ideal_answer
FROM qa_table;

-- 12. Migrate data from candidate_answers_table to appropriate new tables
-- Technical answers
INSERT INTO technical_answers_table (answer_id, candidate_id, technical_question_id, user_answer, score, feedback)
SELECT 
    'ta_' || answer_id,
    candidate_id,
    'tq_' || question_id,
    user_answer,
    score,
    feedback
FROM candidate_answers_table 
WHERE question_type = 'technical';

-- Behavioral answers
INSERT INTO behavioral_answers_table (answer_id, candidate_id, behavioral_question_id, user_answer, score, feedback)
SELECT 
    'ba_' || answer_id,
    candidate_id,
    question_id,
    user_answer,
    score,
    feedback
FROM candidate_answers_table 
WHERE question_type = 'behavioral';

-- 13. Drop old tables that are being replaced
DROP TABLE IF EXISTS qa_table;
DROP TABLE IF EXISTS candidate_answers_table; 

-- 14. Create screening_interview_steps table
CREATE TABLE IF NOT EXISTS screening_interview_steps (
    step_id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    type TEXT NOT NULL,
    focus TEXT,
    includes TEXT,
    text TEXT NOT NULL,
    notes TEXT,
    fallback_if_missing TEXT,
    FOREIGN KEY (requirement_id) REFERENCES requirements_table(requirement_id),
    FOREIGN KEY (candidate_id) REFERENCES candidate_table(candidate_id)
);

-- 15. Add candidate_id column to existing screening_interview_steps table if it doesn't exist
-- This handles the case where the table was created before the candidate_id column was added
ALTER TABLE screening_interview_steps ADD COLUMN candidate_id TEXT;

-- Migration for persistent interview session storage
CREATE TABLE IF NOT EXISTS interview_sessions (
  session_id TEXT PRIMARY KEY,
  candidate_id INTEGER NOT NULL,
  requirement_id INTEGER NOT NULL,
  session_data TEXT NOT NULL,
  last_activity TEXT NOT NULL
);
-- You can run this migration using: sqlite3 app.db < database_migration.sql
-- Or add to your migration runner if you have one.