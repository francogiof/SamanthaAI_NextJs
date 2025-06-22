import { NextRequest, NextResponse } from 'next/server';
import { getCandidatesForTeamLeader } from '@/lib/models/candidateTeamLeader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamLeaderStackAuthId = searchParams.get('teamLeaderStackAuthId');
    if (!teamLeaderStackAuthId) {
      return NextResponse.json({ error: 'Missing teamLeaderStackAuthId' }, { status: 400 });
    }
    const candidates = getCandidatesForTeamLeader(teamLeaderStackAuthId);
    return NextResponse.json({ candidates });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
