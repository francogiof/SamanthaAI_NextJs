import { NextRequest, NextResponse } from 'next/server';
import { interviewManager } from '@/lib/interviewManager';
import { focusedInterviewAgent } from '@/lib/focusedInterviewAgent';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/focused-conversation] Processing request...');
    
    const { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      isNewSession = false
    } = await req.json();
    
    console.log('[API/screening/focused-conversation] Received data:', { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      isNewSession
    });

    if (!candidateId || !requirementId) {
      console.log('[API/screening/focused-conversation] Missing required parameters');
      return NextResponse.json({ error: 'Missing candidateId or requirementId' }, { status: 400 });
    }

    let currentSessionId = sessionId;

    // Create new session if needed
    if (isNewSession || !currentSessionId) {
      currentSessionId = await interviewManager.createSession(candidateId, requirementId);
      console.log('[API/screening/focused-conversation] Created new session:', currentSessionId);
    }

    // Get session info
    const session = interviewManager.getSession(currentSessionId);
    if (!session) {
      console.log('[API/screening/focused-conversation] Session not found');
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate agent response
    const agentResult = await focusedInterviewAgent.generateResponse(
      currentSessionId, 
      candidateMessage || ''
    );

    // Get updated progress and context window info
    const progress = focusedInterviewAgent.getProgress(currentSessionId);
    const contextWindowInfo = focusedInterviewAgent.getContextWindowInfo(currentSessionId);
    const allStepsWithStatus = focusedInterviewAgent.getAllStepsWithStatus(currentSessionId);

    // Check if we should advance context window
    if (interviewManager.shouldAdvanceContextWindow(currentSessionId)) {
      interviewManager.advanceContextWindow(currentSessionId);
      console.log('[API/screening/focused-conversation] Advanced context window');
      
      // If this was a section transition, modify the response
      if (agentResult.shouldMove && !candidateMessage) {
        const sectionMessage = focusedInterviewAgent.getSectionTransitionMessage(currentSessionId);
        agentResult.response = sectionMessage + ' ' + agentResult.response;
      }
    }

    // Check if we should advance to next section
    const shouldAdvanceSection = focusedInterviewAgent.shouldAdvanceToNextSection(currentSessionId);
    if (shouldAdvanceSection && !candidateMessage) {
      console.log('[API/screening/focused-conversation] Should advance to next section');
    }

    console.log('[API/screening/focused-conversation] Generated response:', {
      response: agentResult.response.substring(0, 100) + '...',
      shouldMove: agentResult.shouldMove,
      reason: agentResult.reason,
      stepCompleted: agentResult.stepCompleted,
      needsFollowUp: agentResult.needsFollowUp,
      needsSecondChance: agentResult.needsSecondChance,
      progress: progress.completionRate.toFixed(1) + '%',
      stepsWithNoResponse: progress.stepsWithNoResponse,
      stepsWithSecondChance: progress.stepsWithSecondChance
    });

    return NextResponse.json({ 
      success: true,
      response: agentResult.response,
      sessionId: currentSessionId,
      progress,
      contextWindowInfo,
      allStepsWithStatus,
      agentResult: {
        shouldMove: agentResult.shouldMove,
        reason: agentResult.reason,
        stepCompleted: agentResult.stepCompleted,
        needsFollowUp: agentResult.needsFollowUp,
        needsSecondChance: agentResult.needsSecondChance
      },
      interviewComplete: progress.interviewComplete
    });

  } catch (error) {
    console.error('[API/screening/focused-conversation] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation response' }, { status: 500 });
  }
} 