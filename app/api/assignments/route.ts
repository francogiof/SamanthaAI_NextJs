import { NextRequest, NextResponse } from 'next/server';
import { assignRequirementToCandidate } from '@/lib/models/candidateAssignments';

export async function POST(req: NextRequest) {
  try {
    const { requirementId, candidateId, assignedBy } = await req.json();
    if (!requirementId || !candidateId || !assignedBy) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    const assignment = assignRequirementToCandidate(requirementId, candidateId, assignedBy);
    return NextResponse.json({ assignment });
  } catch (error) {
    console.log('[API/assignments] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
