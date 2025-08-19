// Interview Manager - Controls interview flow and step tracking
export interface InterviewStep {
  step_id: number;
  step_order: number;
  step_name: string;
  type: 'static' | 'semi-static' | 'relational';
  focus?: string;
  text: string;
  notes?: string;
}

export interface StepResponse {
  step_id: number;
  step_order: number;
  step_name: string;
  hasResponse: boolean;
  responseQuality: 'none' | 'partial' | 'complete';
  candidateResponse?: string;
  completed: boolean;
}

export interface InterviewSession {
  sessionId: string;
  candidateId: number;
  requirementId: number;
  currentStep: number;
  totalSteps: number;
  stepResponses: Map<number, StepResponse>;
  memory: {
    keyPoints: string[];
    candidateStrengths: string[];
    areasOfConcern: string[];
  };
  interviewComplete: boolean;
  startTime: Date;
  lastActivity: Date;
}

export class InterviewManager {
  private sessions: Map<string, InterviewSession> = new Map();
  private stepsCache: Map<string, InterviewStep[]> = new Map();

  // Create new interview session
  async createSession(candidateId: number, requirementId: number): Promise<string> {
    const sessionId = `interview_${candidateId}_${requirementId}_${Date.now()}`;
    
    // Load all steps for this candidate/requirement
    const allSteps = await this.loadSteps(candidateId, requirementId);
    
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
      memory: {
        keyPoints: [],
        candidateStrengths: [],
        areasOfConcern: []
      },
      interviewComplete: false,
      startTime: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, session);
    console.log(`[InterviewManager] Created session ${sessionId} with ${allSteps.length} steps`);
    
    return sessionId;
  }

  // Move to next step
  moveToNextStep(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.currentStep++;
    session.lastActivity = new Date();

    // Check if interview is complete
    if (session.currentStep >= session.totalSteps) {
      session.interviewComplete = true;
      console.log(`[InterviewManager] Interview completed for session ${sessionId}`);
    }

    console.log(`[InterviewManager] Moved to step ${session.currentStep} of ${session.totalSteps}`);
    return true;
  }

  // Get current step with response tracking
  getCurrentStep(sessionId: string): { step: InterviewStep | null; response: StepResponse | null } {
    const session = this.sessions.get(sessionId);
    if (!session) return { step: null, response: null };

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    
    // Ensure currentStep is within bounds
    if (session.currentStep >= allSteps.length) {
      console.log(`[InterviewManager] Current step ${session.currentStep} exceeds total steps ${allSteps.length}`);
      return { step: null, response: null };
    }
    
    const currentStep = allSteps[session.currentStep];
    const response = currentStep ? session.stepResponses.get(currentStep.step_id) : null;

    console.log(`[InterviewManager] Current step: ${session.currentStep + 1}/${allSteps.length} (ID: ${currentStep?.step_id}, Name: ${currentStep?.step_name})`);
    return { step: currentStep || null, response: response || null };
  }

  // Record candidate response
  recordResponse(sessionId: string, stepId: number, candidateResponse: string, quality: 'partial' | 'complete'): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    response.hasResponse = true;
    response.responseQuality = quality;
    response.candidateResponse = candidateResponse;
    response.completed = quality === 'complete';
    session.lastActivity = new Date();

    console.log(`[InterviewManager] Recorded response for step ${stepId}, quality: ${quality}, completed: ${response.completed}`);
    return true;
  }

  // Get all steps with their completion status for UI indicators
  getAllStepsWithStatus(sessionId: string): Array<InterviewStep & { status: 'completed' | 'partial' | 'no-response' | 'current' }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    
    return allSteps.map((step, index) => {
      const response = session.stepResponses.get(step.step_id);
      let status: 'completed' | 'partial' | 'no-response' | 'current' = 'no-response';
      
      if (index === session.currentStep) {
        status = 'current';
      } else if (response?.completed) {
        status = 'completed';
      } else if (response?.hasResponse && response.responseQuality === 'partial') {
        status = 'partial';
      }
      
      return { ...step, status };
    });
  }

  // Get session statistics
  getSessionStats(sessionId: string): {
    totalSteps: number;
    completedSteps: number;
    currentStep: number;
    completionRate: number;
    interviewComplete: boolean;
    stepsWithNoResponse: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        totalSteps: 0,
        completedSteps: 0,
        currentStep: 0,
        completionRate: 0,
        interviewComplete: false,
        stepsWithNoResponse: 0
      };
    }

    const completedSteps = Array.from(session.stepResponses.values())
      .filter(response => response.completed).length;
    
    const stepsWithNoResponse = Array.from(session.stepResponses.values())
      .filter(response => !response.hasResponse).length;

    return {
      totalSteps: session.totalSteps,
      completedSteps,
      currentStep: session.currentStep,
      completionRate: (completedSteps / session.totalSteps) * 100,
      interviewComplete: session.interviewComplete,
      stepsWithNoResponse
    };
  }

  // Update memory
  updateMemory(sessionId: string, memoryUpdate: Partial<InterviewSession['memory']>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.memory = { ...session.memory, ...memoryUpdate };
    session.lastActivity = new Date();
    return true;
  }

  // Get session
  getSession(sessionId: string): InterviewSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Clean up old sessions (optional)
  cleanupOldSessions(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < cutoff) {
        this.sessions.delete(sessionId);
        console.log(`[InterviewManager] Cleaned up old session ${sessionId}`);
      }
    }
  }

  // Private method to load steps from database
  private async loadSteps(candidateId: number, requirementId: number): Promise<InterviewStep[]> {
    const cacheKey = `${candidateId}_${requirementId}`;
    
    // Check cache first
    if (this.stepsCache.has(cacheKey)) {
      return this.stepsCache.get(cacheKey)!;
    }

    // Load from database
    try {
      const { default: db } = await import('@/components/screening-interview/db');
      const steps = db.prepare(`
        SELECT step_id, step_order, step_name, type, focus, text, notes
        FROM screening_interview_steps 
        WHERE candidate_id = ? AND requirement_id = ? 
        ORDER BY step_order
      `).all(candidateId, requirementId) as InterviewStep[];

      this.stepsCache.set(cacheKey, steps);
      console.log(`[InterviewManager] Loaded ${steps.length} steps for ${cacheKey}`);
      return steps;
    } catch (error) {
      console.error('[InterviewManager] Error loading steps:', error);
      return [];
    }
  }
}

// Export singleton instance
export const interviewManager = new InterviewManager();