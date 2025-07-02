import db from '../db';

// Requirements table model and helpers
export function initRequirementsTable() {
  db.prepare(`CREATE TABLE IF NOT EXISTS requirements_table (
    requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_user_id INTEGER NOT NULL,
    creator_role TEXT NOT NULL,
    role_name TEXT NOT NULL,
    responsibilities TEXT,
    required_skills TEXT,
    experience_required_years INTEGER
  )`).run();
}

export function getRequirementById(requirementId: number) {
  initRequirementsTable();
  const req = db.prepare('SELECT * FROM requirements_table WHERE requirement_id = ?').get(requirementId);
  console.log(`[Requirements] Get requirement by id ${requirementId}:`, req);
  return req;
}

export function listRequirements() {
  initRequirementsTable();
  const requirements = db.prepare('SELECT * FROM requirements_table').all();
  console.log('[Requirements] Listing all requirements:', requirements);
  return requirements;
}
