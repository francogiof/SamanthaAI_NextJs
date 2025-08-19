import { NextRequest, NextResponse } from 'next/server';
import db from '@/components/screening-interview/db';

interface InterviewStep {
  step_id: number;
  step_order: number;
  step_name: string;
  type: string;
  focus?: string;
  text: string;
  notes?: string;
  structure?: string; // Add structure field to match DB and CSV
}

interface StepResponse {
  step_id: number;
  step_order: number;
  step_name: string;
  hasResponse: boolean;
  responseQuality: 'none' | 'partial' | 'complete';
  candidateResponse?: string;
  completed: boolean;
}

interface InterviewSession {
  sessionId: string;
  candidateId: number;
  requirementId: number;
  currentStep: number;
  totalSteps: number;
  stepResponses: Map<number, StepResponse>;
  interviewComplete: boolean;
  startTime: Date;
  lastActivity: Date;
}

class StepByStepInterviewManager {
  private sessions: Map<string, InterviewSession> = new Map();
  private stepsCache: Map<string, InterviewStep[]> = new Map();

  // Create new interview session
  async createSession(candidateId: number, requirementId: number): Promise<string> {
    const sessionId = `step_interview_${candidateId}_${requirementId}_${Date.now()}`;
    
    // Load all steps for this candidate/requirement
    const allSteps = await this.loadSteps(candidateId, requirementId);
    
    if (allSteps.length === 0) {
      throw new Error('No interview steps found for this candidate and requirement');
    }
    
    // Initialize step responses tracking
    const stepResponses = new Map<number, StepResponse>();
    allSteps.forEach(step => {
      stepResponses.set(step.step_id, {
        step_id: step.step_id,
        step_order: step.step_order,
        step_name: step.step_name,
        hasResponse: false,
        responseQuality: 'none',
        completed: false
      });
    });

    const session: InterviewSession = {
      sessionId,
      candidateId,
      requirementId,
      currentStep: 0,
      totalSteps: allSteps.length,
      stepResponses,
      interviewComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`[StepByStepManager] Created session ${sessionId} with ${allSteps.length} steps`);
    
    return sessionId;
  }

  // Get session info
  getSession(sessionId: string): InterviewSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Get current step
  getCurrentStep(sessionId: string): { step: InterviewStep | null; response: StepResponse | null } {
    const session = this.sessions.get(sessionId);
    if (!session) return { step: null, response: null };

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    
    if (session.currentStep >= allSteps.length) {
      return { step: null, response: null };
    }
    
    const currentStep = allSteps[session.currentStep];
    const response = currentStep ? session.stepResponses.get(currentStep.step_id) : null;

    return { step: currentStep || null, response: response || null };
  }

  // Get progress info
  getProgress(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    const completedSteps = Array.from(session.stepResponses.values()).filter(r => r.completed).length;
    const stepsWithNoResponse = Array.from(session.stepResponses.values()).filter(r => !r.hasResponse).length;
    
    return {
      currentStep: session.currentStep,
      totalSteps: session.totalSteps,
      completionRate: allSteps.length > 0 ? (completedSteps / allSteps.length) * 100 : 0,
      stepsWithNoResponse,
      interviewComplete: session.interviewComplete
    };
  }

  // Get all steps with status
  getAllStepsWithStatus(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    
    return allSteps.map(step => {
      const response = session.stepResponses.get(step.step_id);
      let status = 'pending';
      
      if (response) {
        if (response.completed) {
          status = 'completed';
        } else if (response.hasResponse) {
          status = 'partial';
        } else if (session.currentStep === step.step_order) {
          status = 'current';
        }
      }
      
      return {
        step_id: step.step_id,
        step_name: step.step_name,
        status,
        structure: step.structure // Now safe to return structure
      };
    });
  }

  // Process candidate response and get next step
  async processResponse(sessionId: string, candidateMessage: string): Promise<{
    response: string;
    shouldMove: boolean;
    reason: string;
    stepCompleted: boolean;
    needsFollowUp: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    console.log(`[StepByStepManager] Processing response for session ${sessionId}`);
    console.log(`[StepByStepManager] Current step: ${session.currentStep}, Total steps: ${session.totalSteps}`);
    console.log(`[StepByStepManager] Candidate message: "${candidateMessage}"`);

    const { step: currentStep, response: stepResponse } = this.getCurrentStep(sessionId);
    console.log(`[StepByStepManager] Current step info:`, {
      stepId: currentStep?.step_id,
      stepOrder: currentStep?.step_order,
      stepName: currentStep?.step_name,
      stepText: currentStep?.text?.substring(0, 50) + '...',
      hasResponse: stepResponse?.hasResponse,
      completed: stepResponse?.completed
    });

    if (!currentStep || !stepResponse) {
      console.log(`[StepByStepManager] No current step or step response found`);
      return {
        response: 'Interview completed. Thank you for your time!',
        shouldMove: false,
        reason: 'no_more_steps',
        stepCompleted: false,
        needsFollowUp: false
      };
    }

    // Update last activity
    session.lastActivity = new Date();

    // If candidate asks a question (ends with ?), answer it briefly
    if (candidateMessage && candidateMessage.trim().endsWith('?')) {
      console.log(`[StepByStepManager] Candidate asked a question, answering...`);
      const answer = await this.answerCandidateQuestion(candidateMessage);
      return {
        response: `${answer}\n\nNow, let's continue with the interview. ${currentStep.text.replace(/^"|"$/g, '')}`,
        shouldMove: false,
        reason: 'answered_question',
        stepCompleted: false,
        needsFollowUp: false
      };
    }

    // Process the candidate's response to the current question
    if (candidateMessage && candidateMessage.trim()) {
      console.log(`[StepByStepManager] Processing candidate response...`);
      // Mark that we have a response and move to next step
      stepResponse.hasResponse = true;
      stepResponse.candidateResponse = candidateMessage;
      stepResponse.responseQuality = 'complete'; // Always mark as complete
      stepResponse.completed = true;
      session.currentStep++;
      
      console.log(`[StepByStepManager] Moved to step ${session.currentStep}`);
      
      // Check if interview is complete
      if (session.currentStep >= session.totalSteps) {
        console.log(`[StepByStepManager] Interview completed`);
        session.interviewComplete = true;
        return {
          response: 'Thank you for completing the interview! We will review your responses and get back to you soon.',
          shouldMove: true,
          reason: 'interview_complete',
          stepCompleted: true,
          needsFollowUp: false
        };
      }

      // Get next step
      const nextStep = this.getCurrentStep(sessionId);
      console.log(`[StepByStepManager] Next step info:`, {
        stepId: nextStep.step?.step_id,
        stepOrder: nextStep.step?.step_order,
        stepName: nextStep.step?.step_name,
        stepText: nextStep.step?.text?.substring(0, 50) + '...'
      });
      
      if (nextStep.step) {
        return {
          response: nextStep.step.text.replace(/^"|"$/g, ''),
          shouldMove: true,
          reason: 'step_completed',
          stepCompleted: true,
          needsFollowUp: false
        };
      }
    } else {
      console.log(`[StepByStepManager] No response provided, moving to next step...`);
      // No response provided, move to next step
      stepResponse.completed = true;
      session.currentStep++;
      
      console.log(`[StepByStepManager] Moved to step ${session.currentStep}`);
      
      if (session.currentStep >= session.totalSteps) {
        console.log(`[StepByStepManager] Interview completed`);
        session.interviewComplete = true;
        return {
          response: 'Thank you for completing the interview! We will review your responses and get back to you soon.',
          shouldMove: true,
          reason: 'interview_complete',
          stepCompleted: true,
          needsFollowUp: false
        };
      }

      const nextStep = this.getCurrentStep(sessionId);
      if (nextStep.step) {
        return {
          response: nextStep.step.text.replace(/^"|"$/g, ''),
          shouldMove: true,
          reason: 'no_response_moving_on',
          stepCompleted: true,
          needsFollowUp: false
        };
      }
    }

    console.log(`[StepByStepManager] Fallback response`);
    return {
      response: 'Let me ask you the next question.',
      shouldMove: false,
      reason: 'processing',
      stepCompleted: false,
      needsFollowUp: false
    };
  }

  // Get the first question to start the interview
  getFirstQuestion(sessionId: string): string {
    const { step } = this.getCurrentStep(sessionId);
    if (!step) {
      return 'No interview questions found. Please contact support.';
    }
    // Remove any extra quotes that might be in the database
    return step.text.replace(/^"|"$/g, '');
  }

  // Private methods
  private async loadSteps(candidateId: number, requirementId: number): Promise<InterviewStep[]> {
    const cacheKey = `${candidateId}_${requirementId}`;
    
    if (this.stepsCache.has(cacheKey)) {
      return this.stepsCache.get(cacheKey)!;
    }

    try {
      // First check if step_name column exists
      const tableInfo = db.prepare("PRAGMA table_info(screening_interview_steps)").all();
      const hasStepName = tableInfo.some((col: any) => col.name === 'step_name');
      
      let steps: InterviewStep[];
      if (hasStepName) {
        steps = db.prepare(`
          SELECT step_id, step_order, step_name, type, focus, text, notes, structure
          FROM screening_interview_steps 
          WHERE candidate_id = ? AND requirement_id = ? 
          ORDER BY step_order
        `).all(candidateId, requirementId) as InterviewStep[];
      } else {
        // Fallback if step_name doesn't exist
        steps = db.prepare(`
          SELECT step_id, step_order, type, focus, text, notes, structure
          FROM screening_interview_steps 
          WHERE candidate_id = ? AND requirement_id = ? 
          ORDER BY step_order
        `).all(candidateId, requirementId) as any[];
        
        // Add step_name as a fallback
        steps = steps.map((step, index) => ({
          ...step,
          step_name: `Step ${index + 1}`
        }));
      }

      this.stepsCache.set(cacheKey, steps);
      console.log(`[StepByStepManager] Loaded ${steps.length} steps for ${cacheKey}`);
      return steps;
    } catch (error) {
      console.error('[StepByStepManager] Error loading steps:', error);
      return [];
    }
  }

  private async answerCandidateQuestion(question: string): Promise<string> {
    const apiKey = process.env.LEMONFOX_LLM_KEY;
    if (!apiKey) {
      return 'That\'s a great question! I\'ll answer it as best I can.';
    }

    try {
      const systemPrompt = `You are Sarah, a professional AI interviewer. Answer the candidate's question briefly and clearly. Keep your response under 50 words. Be helpful but concise.`;
      
      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Candidate asked: "${question}"` }
          ],
          max_tokens: 100,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (response.ok) {
        const result: any = await response.json();
        if (result?.choices?.[0]?.message?.content) {
          return result.choices[0].message.content.trim();
        }
      }
    } catch (error) {
      console.error('[StepByStepManager] Error answering question:', error);
    }

    return 'That\'s a great question! I\'ll answer it as best I can.';
  }
}

const stepByStepManager = new StepByStepInterviewManager();

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/step-by-step] Processing request...');
    
    const { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      isNewSession = false
    } = await req.json();
    
    console.log('[API/screening/step-by-step] Received data:', { 
      candidateMessage, 
      candidateId, 
      requirementId,
      sessionId,
      isNewSession
    });

    if (!candidateId || !requirementId) {
      console.log('[API/screening/step-by-step] Missing required parameters');
      return NextResponse.json({ error: 'Missing candidateId or requirementId' }, { status: 400 });
    }

    let currentSessionId = sessionId;

    // Create new session if needed
    if (isNewSession || !currentSessionId) {
      try {
        currentSessionId = await stepByStepManager.createSession(candidateId, requirementId);
        console.log('[API/screening/step-by-step] Created new session:', currentSessionId);
        
        // For new sessions, return the first question immediately
        const firstQuestion = stepByStepManager.getFirstQuestion(currentSessionId);
        const progress = stepByStepManager.getProgress(currentSessionId);
        const allStepsWithStatus = stepByStepManager.getAllStepsWithStatus(currentSessionId);
        
        return NextResponse.json({ 
          success: true,
          response: firstQuestion,
          sessionId: currentSessionId,
          progress,
          allStepsWithStatus,
          agentResult: {
            shouldMove: false,
            reason: 'session_started',
            stepCompleted: false,
            needsFollowUp: false
          },
          interviewComplete: false
        });
      } catch (error) {
        console.error('[API/screening/step-by-step] Error creating session:', error);
        return NextResponse.json({ error: 'Failed to create interview session' }, { status: 500 });
      }
    }

    // Process candidate response
    try {
      console.log('[API/screening/step-by-step] Processing response for session:', currentSessionId);
      console.log('[API/screening/step-by-step] Candidate message:', candidateMessage);
      
      // Get session info for debugging
      const session = stepByStepManager.getSession(currentSessionId);
      console.log('[API/screening/step-by-step] Session info:', {
        sessionId: currentSessionId,
        currentStep: session?.currentStep,
        totalSteps: session?.totalSteps,
        interviewComplete: session?.interviewComplete
      });
      
      const agentResult = await stepByStepManager.processResponse(currentSessionId, candidateMessage || '');
      console.log('[API/screening/step-by-step] Agent result:', agentResult);
      
      const progress = stepByStepManager.getProgress(currentSessionId);
      console.log('[API/screening/step-by-step] Progress:', progress);
      
      const allStepsWithStatus = stepByStepManager.getAllStepsWithStatus(currentSessionId);
      console.log('[API/screening/step-by-step] All steps with status:', allStepsWithStatus.length);

      console.log('[API/screening/step-by-step] Generated response:', {
        response: agentResult.response.substring(0, 100) + '...',
        shouldMove: agentResult.shouldMove,
        reason: agentResult.reason,
        stepCompleted: agentResult.stepCompleted,
        needsFollowUp: agentResult.needsFollowUp,
        progress: progress?.completionRate.toFixed(1) + '%'
      });

      return NextResponse.json({ 
        success: true,
        response: agentResult.response,
        sessionId: currentSessionId,
        progress,
        allStepsWithStatus,
        agentResult: {
          shouldMove: agentResult.shouldMove,
          reason: agentResult.reason,
          stepCompleted: agentResult.stepCompleted,
          needsFollowUp: agentResult.needsFollowUp
        },
        interviewComplete: progress?.interviewComplete || false
      });
    } catch (error) {
      console.error('[API/screening/step-by-step] Error processing response:', error);
      console.error('[API/screening/step-by-step] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      return NextResponse.json({ error: 'Failed to process response: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
    }

  } catch (error) {
    console.error('[API/screening/step-by-step] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation response' }, { status: 500 });
  }
}