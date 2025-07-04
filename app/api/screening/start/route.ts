import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/start] Starting screening process...');
    
    const { requirementId, userId } = await req.json();
    console.log('[API/screening/start] Received params:', { requirementId, userId });
    
    if (!requirementId || !userId) {
      console.log('[API/screening/start] Missing required parameters');
      return NextResponse.json({ error: 'Missing requirementId or userId' }, { status: 400 });
    }

    // Read requirement data
    console.log('[API/screening/start] Reading requirement data for ID:', requirementId);
    const requirement = db.prepare('SELECT * FROM requirements_table WHERE requirement_id = ?').get(requirementId);
    console.log('[API/screening/start] Requirement data:', requirement);
    
    if (!requirement) {
      console.log('[API/screening/start] Requirement not found');
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Read candidate data
    console.log('[API/screening/start] Reading candidate data for user ID:', userId);
    const candidate = db.prepare('SELECT * FROM candidate_table WHERE user_id = ?').get(userId);
    console.log('[API/screening/start] Candidate data:', candidate);
    
    if (!candidate) {
      console.log('[API/screening/start] Candidate not found');
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Check if screening score already exists
    console.log('[API/screening/start] Checking existing screening score for candidate ID:', candidate.candidate_id);
    const existingScore = db.prepare('SELECT * FROM scores_table WHERE candidate_id = ?').get(candidate.candidate_id);
    console.log('[API/screening/start] Existing score:', existingScore);

    // Parse JSON fields if they exist
    let parsedRequirement = { ...requirement };
    let parsedCandidate = { ...candidate };
    
    try {
      if (requirement.required_skills && typeof requirement.required_skills === 'string') {
        parsedRequirement.required_skills = JSON.parse(requirement.required_skills);
      }
      if (candidate.education && typeof candidate.education === 'string') {
        parsedCandidate.education = JSON.parse(candidate.education);
      }
      if (candidate.personal_projects && typeof candidate.personal_projects === 'string') {
        parsedCandidate.personal_projects = JSON.parse(candidate.personal_projects);
      }
      if (candidate.cv_experience && typeof candidate.cv_experience === 'string') {
        parsedCandidate.cv_experience = JSON.parse(candidate.cv_experience);
      }
    } catch (parseError) {
      console.log('[API/screening/start] Error parsing JSON fields:', parseError);
    }

    // Prepare screening context
    const screeningContext = {
      requirement: parsedRequirement,
      candidate: parsedCandidate,
      hasExistingScore: !!existingScore,
      existingScore: existingScore?.initial_screening_score || null
    };

    console.log('[API/screening/start] Screening context prepared:', {
      requirementId: screeningContext.requirement.requirement_id,
      roleName: screeningContext.requirement.role_name,
      candidateId: screeningContext.candidate.candidate_id,
      candidateName: screeningContext.candidate.name,
      hasExistingScore: screeningContext.hasExistingScore
    });

    console.log('[API/screening/start] Screening process started successfully');
    return NextResponse.json({ 
      success: true, 
      screeningContext,
      message: 'Screening session initialized'
    });

  } catch (error) {
    console.error('[API/screening/start] Error:', error);
    return NextResponse.json({ error: 'Failed to start screening process' }, { status: 500 });
  }
} 