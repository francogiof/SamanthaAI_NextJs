-- Fix requirements_table ID type mismatch
-- Backup existing data
CREATE TABLE requirements_table_backup AS SELECT * FROM requirements_table;

-- Drop and recreate with correct types
DROP TABLE requirements_table;
CREATE TABLE requirements_table (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_user_id INTEGER,
    creator_role TEXT,
    role_name TEXT,
    responsibilities TEXT,
    required_skills TEXT,
    experience_required_years TEXT,
    company_id TEXT,
    FOREIGN KEY (creator_user_id) REFERENCES user_roles(id)
);

-- Migrate data with proper type conversion
INSERT INTO requirements_table (requirement_id, creator_user_id, creator_role, role_name, responsibilities, required_skills, experience_required_years, company_id)
SELECT 
    CAST(requirement_id AS INTEGER),
    CAST(creator_user_id AS INTEGER),
    creator_role, role_name, responsibilities, required_skills, experience_required_years, company_id
FROM requirements_table_backup
WHERE requirement_id IS NOT NULL;

-- Verify the migration
SELECT 'requirements_table' as table_name, COUNT(*) as count FROM requirements_table;
SELECT * FROM requirements_table; 