import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/score] Processing screening score submission...');
    
    const { candidateId, scores, responses } = await req.json();
    console.log('[API/screening/score] Received data:', { candidateId, scores, responses });
    
    if (!candidateId || !scores) {
      console.log('[API/screening/score] Missing required parameters');
      return NextResponse.json({ error: 'Missing candidateId or scores' }, { status: 400 });
    }

    // Calculate overall score (weighted average)
    const weights = {
      skillsMatch: 0.35,
      experienceRelevance: 0.30,
      communication: 0.20,
      culturalFit: 0.15
    };

    const overallScore = Math.round(
      scores.skillsMatch * weights.skillsMatch +
      scores.experienceRelevance * weights.experienceRelevance +
      scores.communication * weights.communication +
      scores.culturalFit * weights.culturalFit
    );

    console.log('[API/screening/score] Calculated overall score:', overallScore);

    // Determine if candidate passes screening (threshold: 70/100)
    const passesScreening = overallScore >= 70;

    console.log('[API/screening/score] Screening result:', { overallScore, passesScreening });

    // Store the score in the database
    try {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO scores_table 
        (candidate_id, initial_screening_score, skills_match_score, experience_relevance_score, communication_score, cultural_fit_score, screening_passed, screening_responses, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = insertStmt.run(
        candidateId,
        overallScore,
        scores.skillsMatch,
        scores.experienceRelevance,
        scores.communication,
        scores.culturalFit,
        passesScreening ? 1 : 0,
        JSON.stringify(responses || [])
      );

      console.log('[API/screening/score] Score stored in database:', result);
    } catch (dbError) {
      console.error('[API/screening/score] Database error:', dbError);
      // Continue even if database fails - we can still return the score
    }

    console.log('[API/screening/score] Screening score processed successfully');
    return NextResponse.json({ 
      success: true, 
      score: overallScore,
      passesScreening,
      breakdown: scores,
      message: `Screening ${passesScreening ? 'passed' : 'requires review'} with score ${overallScore}/100`
    });

  } catch (error) {
    console.error('[API/screening/score] Error:', error);
    return NextResponse.json({ error: 'Failed to process screening score' }, { status: 500 });
  }
} 