# Database Structure Migration Summary

## Overview
Updated the database structure to support a more comprehensive hiring pipeline with separate tables for different types of questions and answers, plus additional context and tracking tables.

## New Tables Created

### 1. company_table.csv
- **Purpose**: Store company information
- **Key Fields**: company_id, name, industry, size, website, location
- **Sample Data**: TechCorp Solutions, DataFlow Analytics, AI Innovations Inc

### 2. screening_questions_table.csv
- **Purpose**: Store basic screening questions (legal, salary, availability)
- **Key Fields**: screening_question_id, requirement_id, question, type
- **Sample Data**: Work authorization, salary expectations, availability questions

### 3. screening_answers_table.csv
- **Purpose**: Store candidate responses to screening questions
- **Key Fields**: answer_id, candidate_id, screening_question_id, user_answer, score, feedback
- **Sample Data**: Alice's responses to screening questions with scores

### 4. behavioral_questions_table_updated.csv
- **Purpose**: Enhanced behavioral questions for culture fit assessment
- **Key Fields**: behavioral_question_id, requirement_id, question, ideal_traits
- **Sample Data**: Team conflict resolution, deadline handling, communication scenarios

### 5. behavioral_answers_table.csv
- **Purpose**: Store candidate responses to behavioral questions
- **Key Fields**: answer_id, candidate_id, behavioral_question_id, user_answer, score, feedback
- **Sample Data**: Alice's detailed behavioral responses with evaluations

### 6. technical_questions_table.csv
- **Purpose**: Replace QA_table with ML-specific technical questions
- **Key Fields**: technical_question_id, requirement_id, question, ideal_answer
- **Sample Data**: ML concepts, deployment processes, evaluation metrics

### 7. technical_answers_table.csv
- **Purpose**: Store candidate responses to technical questions
- **Key Fields**: answer_id, candidate_id, technical_question_id, user_answer, score, feedback
- **Sample Data**: Alice's technical responses with detailed feedback

### 8. context_requirements_table.csv
- **Purpose**: Store job context and requirements details
- **Key Fields**: context_id, requirement_id, salary_range, contract_type, start_date, schedule, extra_notes, exclusion_criteria
- **Sample Data**: Salary ranges, work arrangements, start dates for ML roles

### 9. candidate_status_table.csv
- **Purpose**: Track candidate progress through hiring pipeline
- **Key Fields**: status_id, candidate_id, requirement_id, current_step, status
- **Sample Data**: Current status of candidates in different stages

## Modified Tables

### requirements_table_updated.csv
- **Change**: Added company_id foreign key
- **Purpose**: Link requirements to specific companies
- **Impact**: Maintains existing data while adding company relationship

## Tables to Remove (Replaced)
- **QA_table.csv** → Replaced by technical_questions_table.csv
- **candidate_answers_table.csv** → Split into screening_answers_table.csv, behavioral_answers_table.csv, technical_answers_table.csv

## Tables to Keep (No Changes)
- candidate_table.csv
- team_leader_table.csv
- user_roles.csv
- candidate_assignments_table.csv
- scores_table.csv
- user_project_submission_table.csv

## Key Relationships
1. **requirements_table** remains the central hub
2. All question tables link to requirement_id
3. All answer tables link to candidate_id and respective question_id
4. company_table connects to requirements via company_id
5. candidate_status_table tracks progress across the pipeline

## Sample Data Context
All sample data is focused on Machine Learning Engineer roles with:
- Realistic salary ranges ($80k-$150k)
- Common ML skills (Python, TensorFlow, PyTorch)
- Relevant behavioral scenarios (team collaboration, technical communication)
- Practical technical questions (deployment, evaluation, best practices)
- Appropriate screening questions (work authorization, availability)

## Migration Steps
1. Create new tables using the CSV files
2. Update requirements_table to include company_id
3. Migrate existing QA data to technical_questions_table
4. Split candidate_answers_table data into appropriate new answer tables
5. Drop old tables (QA_table, candidate_answers_table)
6. Update application code to use new table structure 