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
  let setClause = Object.keys(profile)
    .map((key) => `${key} = ?`)
    .join(', ');
  let values = Object.values(profile);
  if (!setClause) return null;
  db.prepare(`UPDATE candidate_table SET ${setClause} WHERE user_id = ?`).run(...values, userId);
  return db.prepare('SELECT * FROM candidate_table WHERE user_id = ?').get(userId);
}
