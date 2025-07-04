import db from '../db';

export function updateCandidateProfile(userId: number, profile: Partial<{
  name: string;
  age: number;
  cv_path: string;
  linkedin: string;
  github: string;
  experience_years: number;
  education: string;
  personal_projects: string;
  introduction: string;
  cv_experience: string;
}>) {
  // Only update fields that exist in the candidate_table schema
  const allowed = [
    'name', 'age', 'cv_path', 'linkedin', 'github', 'experience_years',
    'education', 'personal_projects', 'introduction', 'cv_experience'
  ];
  const filtered = Object.fromEntries(
    Object.entries(profile).filter(([k]) => allowed.includes(k))
  );
  let setClause = Object.keys(filtered)
    .map((key) => `${key} = ?`)
    .join(', ');
  let values = Object.values(filtered);
  if (!setClause) return null;
  console.log('[updateCandidateProfile] Updating user', userId, 'with:', filtered);
  db.prepare(`UPDATE candidate_table SET ${setClause} WHERE user_id = ?`).run(...values, userId);
  return db.prepare('SELECT * FROM candidate_table WHERE user_id = ?').get(userId);
}
