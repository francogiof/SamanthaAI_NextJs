-- Fix ID Type Mismatches Migration
-- This script fixes the critical security issue where ID types don't match across tables

-- 1. Backup existing data
CREATE TABLE candidate_table_backup AS SELECT * FROM candidate_table;
CREATE TABLE team_leader_table_backup AS SELECT * FROM team_leader_table;
CREATE TABLE screening_interview_steps_backup AS SELECT * FROM screening_interview_steps;

-- 2. Drop and recreate candidate_table with correct types
DROP TABLE candidate_table;
CREATE TABLE candidate_table (
    candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT,
    age TEXT,
    cv_path TEXT,
    linkedin TEXT,
    github TEXT,
    experience_years TEXT,
    education TEXT,
    personal_projects TEXT,
    introduction TEXT,
    cv_experience TEXT,
    FOREIGN KEY (user_id) REFERENCES user_roles(id)
);

-- 3. Drop and recreate team_leader_table with correct types
DROP TABLE team_leader_table;
CREATE TABLE team_leader_table (
    leader_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    department TEXT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES user_roles(id)
);

-- 4. Drop and recreate screening_interview_steps with correct foreign keys
DROP TABLE screening_interview_steps;
CREATE TABLE screening_interview_steps (
    step_id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
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

-- 5. Migrate candidate data with proper type conversion
INSERT INTO candidate_table (candidate_id, user_id, name, age, cv_path, linkedin, github, experience_years, education, personal_projects, introduction, cv_experience)
SELECT 
    CAST(candidate_id AS INTEGER),
    CAST(user_id AS INTEGER),
    name, age, cv_path, linkedin, github, experience_years, education, personal_projects, introduction, cv_experience
FROM candidate_table_backup
WHERE candidate_id IS NOT NULL AND user_id IS NOT NULL;

-- 6. Migrate team leader data with proper type conversion
INSERT INTO team_leader_table (leader_id, user_id, first_name, last_name, email, department, notes)
SELECT 
    CAST(leader_id AS INTEGER),
    CAST(user_id AS INTEGER),
    first_name, last_name, email, department, notes
FROM team_leader_table_backup
WHERE leader_id IS NOT NULL AND user_id IS NOT NULL;

-- 7. Verify the migration
SELECT 'candidate_table' as table_name, COUNT(*) as count FROM candidate_table
UNION ALL
SELECT 'team_leader_table' as table_name, COUNT(*) as count FROM team_leader_table
UNION ALL
SELECT 'user_roles' as table_name, COUNT(*) as count FROM user_roles;

-- 8. Show the corrected relationships
SELECT 'Candidate Relationships:' as info;
SELECT ur.id as user_role_id, ur.role, ct.candidate_id, ct.user_id 
FROM user_roles ur 
LEFT JOIN candidate_table ct ON ur.id = ct.user_id 
WHERE ur.role = 'candidate';

SELECT 'Team Leader Relationships:' as info;
SELECT ur.id as user_role_id, ur.role, tlt.leader_id, tlt.user_id 
FROM user_roles ur 
LEFT JOIN team_leader_table tlt ON ur.id = tlt.user_id 
WHERE ur.role = 'team-leader'; 