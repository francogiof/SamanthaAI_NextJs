import { NextRequest, NextResponse } from 'next/server';
import { listQuestionsForRequirement } from '@/lib/models/QA';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requirementId = searchParams.get('requirementId');
    if (!requirementId) {
      return NextResponse.json({ error: 'Missing requirementId' }, { status: 400 });
    }
    const questions = listQuestionsForRequirement(Number(requirementId));
    return NextResponse.json({ questions });
  } catch (error) {
    console.log('[API/questions] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
