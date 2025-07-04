import { NextRequest, NextResponse } from 'next/server';
import { updateCandidateProfile } from '@/lib/models/updateCandidate';
import { createCandidateProfile } from '@/lib/models/candidate';

export async function POST(req: NextRequest) {
  try {
    const { userId, profile } = await req.json();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    // Ensure candidate row exists
    createCandidateProfile(Number(userId));
    // Serialize object/array fields to JSON strings
    const serializableProfile = { ...profile };
    ['education', 'personal_projects', 'cv_experience'].forEach((key) => {
      if (serializableProfile[key] && typeof serializableProfile[key] !== 'string') {
        serializableProfile[key] = JSON.stringify(serializableProfile[key]);
      }
    });
    const updated = updateCandidateProfile(Number(userId), serializableProfile);
    return NextResponse.json({ updated });
  } catch (error) {
    console.log('[API/candidate/update] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
