import { NextRequest, NextResponse } from 'next/server';
import { submitCandidateAnswer } from '@/lib/models/candidateAnswers';

export async function POST(req: NextRequest) {
  try {
    const { candidateId, questionId, questionType, userAnswer } = await req.json();
    if (!candidateId || !questionId || !questionType || !userAnswer) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    const answer = submitCandidateAnswer(candidateId, questionId, questionType, userAnswer);
    return NextResponse.json({ answer });
  } catch (error) {
    console.log('[API/answers] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
