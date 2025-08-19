import { NextRequest, NextResponse } from 'next/server';
import { interviewManager } from '@/components/screening-interview/interviewManager';
import { focusedInterviewAgent } from '@/components/screening-interview/focusedInterviewAgent';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/focused-conversation] Processing request...');
    
    const { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      currentStep = 0,
      isNewSession = false
    } = await req.json();
    
    console.log('[API/screening/focused-conversation] Received data:', { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      currentStep,
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

    // Generate agent response using the correct parameters
    const agentResult = await focusedInterviewAgent.generateResponse(
      candidateId,
      requirementId,
      candidateMessage || '',
      currentStep
    );

    // Get updated progress from interview manager
    const progress = interviewManager.getSessionStats(currentSessionId);
    const allStepsWithStatus = interviewManager.getAllStepsWithStatus(currentSessionId);

    console.log('[API/screening/focused-conversation] Generated response:', {
      response: agentResult.response.substring(0, 100) + '...',
      nextStep: agentResult.nextStep,
      progress: progress?.completionRate?.toFixed(1) + '%',
      stepsWithNoResponse: progress?.stepsWithNoResponse
    });

    return NextResponse.json({ 
      success: true,
      response: agentResult.response,
      sessionId: currentSessionId,
      nextStep: agentResult.nextStep,
      progress,
      allStepsWithStatus,
      interviewComplete: progress?.interviewComplete || false
    });

  } catch (error) {
    console.error('[API/screening/focused-conversation] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation response' }, { status: 500 });
  }
}