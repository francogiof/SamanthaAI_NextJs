import { NextRequest, NextResponse } from 'next/server';
import { updateCandidateProfile } from '@/lib/models/updateCandidate';

export async function POST(req: NextRequest) {
  try {
    const { userId, profile } = await req.json();
    if (!userId || !profile) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    const updated = updateCandidateProfile(Number(userId), profile);
    return NextResponse.json({ updated });
  } catch (error) {
    console.log('[API/candidate/update] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
