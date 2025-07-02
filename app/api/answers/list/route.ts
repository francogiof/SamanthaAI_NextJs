import { NextRequest, NextResponse } from 'next/server';
import { listAnswersForCandidate } from '@/lib/models/candidateAnswers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }
    const answers = listAnswersForCandidate(Number(candidateId));
    return NextResponse.json({ answers });
  } catch (error) {
    console.log('[API/answers/list] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
