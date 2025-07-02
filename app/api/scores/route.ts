import { NextRequest, NextResponse } from 'next/server';
import { getScoresForCandidate, updateScoresForCandidate } from '@/lib/models/scores';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }
    const scores = getScoresForCandidate(Number(candidateId));
    return NextResponse.json({ scores });
  } catch (error) {
    console.log('[API/scores] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidateId, updates } = await req.json();
    if (!candidateId || !updates) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    const updated = updateScoresForCandidate(Number(candidateId), updates);
    return NextResponse.json({ updated });
  } catch (error) {
    console.log('[API/scores] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
