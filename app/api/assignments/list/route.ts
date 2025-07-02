import { NextRequest, NextResponse } from 'next/server';
import { listAssignmentsForCandidate } from '@/lib/models/candidateAssignments';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }
    const assignments = listAssignmentsForCandidate(Number(candidateId));
    return NextResponse.json({ assignments });
  } catch (error) {
    console.log('[API/assignments/list] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
