import { NextRequest, NextResponse } from 'next/server';
import { submitProject, listSubmissionsForCandidate, updateSubmissionScore, canSubmitProject } from '@/lib/models/userProjectSubmission';

export async function POST(req: NextRequest) {
  try {
    const { candidateId, requirementId, submissionLink } = await req.json();
    if (!candidateId || !requirementId || !submissionLink) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }
    // Step progression: Only allow if candidate can submit
    if (!canSubmitProject(candidateId)) {
      return NextResponse.json({ error: 'Not eligible to submit project. Complete previous steps and meet score threshold.' }, { status: 403 });
    }
    const submission = submitProject(candidateId, requirementId, submissionLink);
    return NextResponse.json({ submission });
  } catch (error) {
    console.log('[API/project-submission] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }
    const submissions = listSubmissionsForCandidate(Number(candidateId));
    return NextResponse.json({ submissions });
  } catch (error) {
    console.log('[API/project-submission] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
