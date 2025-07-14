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
  followUpCount: number;
  maxFollowUps: number;
  secondChanceUsed: boolean; // Track if second chance was given
  completed: boolean;
}

export interface InterviewSession {
  sessionId: string;
  candidateId: number;
  requirementId: number;
  currentStep: number;
  totalSteps: number;
  stepResponses: Map<number, StepResponse>;
  currentContextWindow: number; // 0, 1, or 2 (representing thirds)
  memory: {
    keyPoints: string[];
    candidateStrengths: string[];
    areasOfConcern: string[];
    followUpQuestions: string[];
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
        followUpCount: 0,
        maxFollowUps: 1, // Reduced from 3 to 1 to prevent follow-up loops
        secondChanceUsed: false, // Track second chance usage
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
      currentContextWindow: 0,
      memory: {
        keyPoints: [],
        candidateStrengths: [],
        areasOfConcern: [],
        followUpQuestions: []
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

    // Mark current step as complete if second chance was used but no response
    const currentStep = this.getCurrentStep(sessionId);
    if (currentStep.response && currentStep.response.secondChanceUsed && !currentStep.response.hasResponse) {
      currentStep.response.completed = true;
      console.log(`[InterviewManager] Marked step ${currentStep.step?.step_id} as complete after second chance with no response`);
    }

    session.currentStep++;
    session.lastActivity = new Date();

    // Check if we need to advance context window
    if (this.shouldAdvanceContextWindow(sessionId)) {
      this.advanceContextWindow(sessionId);
      console.log(`[InterviewManager] Advanced to context window ${session.currentContextWindow} after step ${session.currentStep}`);
    }

    // Check if interview is complete
    if (session.currentStep >= session.totalSteps) {
      session.interviewComplete = true;
      console.log(`[InterviewManager] Interview completed for session ${sessionId}`);
    }

    console.log(`[InterviewManager] Moved to step ${session.currentStep} of ${session.totalSteps} in window ${session.currentContextWindow}`);
    return true;
  }

  // Get current context window (1/3 of steps)
  getCurrentContextWindow(sessionId: string): InterviewStep[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    const stepsPerWindow = Math.ceil(allSteps.length / 3);
    const startIndex = session.currentContextWindow * stepsPerWindow;
    const endIndex = Math.min(startIndex + stepsPerWindow, allSteps.length);

    console.log(`[InterviewManager] Context window ${session.currentContextWindow}: steps ${startIndex + 1}-${endIndex} of ${allSteps.length}`);
    return allSteps.slice(startIndex, endIndex);
  }

  // Check if we need to advance context window
  shouldAdvanceContextWindow(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const currentWindowSteps = this.getCurrentContextWindow(sessionId);
    const completedInWindow = currentWindowSteps.every(step => {
      const response = session.stepResponses.get(step.step_id);
      return response?.completed || false;
    });

    const shouldAdvance = completedInWindow && session.currentContextWindow < 2;
    console.log(`[InterviewManager] Should advance context window: ${shouldAdvance} (completed: ${completedInWindow}, current window: ${session.currentContextWindow})`);
    return shouldAdvance;
  }

  // Advance to next context window
  advanceContextWindow(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.currentContextWindow >= 2) return false;

    session.currentContextWindow++;
    session.lastActivity = new Date();
    console.log(`[InterviewManager] Advanced to context window ${session.currentContextWindow}`);
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

  // Check if step needs follow-up
  needsFollowUp(sessionId: string, stepId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    return !response.completed && response.followUpCount < response.maxFollowUps;
  }

  // Check if step needs second chance (no response at all)
  needsSecondChance(sessionId: string, stepId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    return !response.hasResponse && !response.secondChanceUsed;
  }

  // Mark second chance as used
  useSecondChance(sessionId: string, stepId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    response.secondChanceUsed = true;
    session.lastActivity = new Date();
    console.log(`[InterviewManager] Second chance used for step ${stepId}`);
    return true;
  }

  // Increment follow-up count
  incrementFollowUp(sessionId: string, stepId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    response.followUpCount++;
    session.lastActivity = new Date();
    console.log(`[InterviewManager] Incremented follow-up count for step ${stepId}: ${response.followUpCount}`);
    return true;
  }

  // Get incomplete steps in current context window
  getIncompleteSteps(sessionId: string): InterviewStep[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const currentWindowSteps = this.getCurrentContextWindow(sessionId);
    return currentWindowSteps.filter(step => {
      const response = session.stepResponses.get(step.step_id);
      return !response?.completed;
    });
  }

  // Get all steps with their completion status for UI indicators
  getAllStepsWithStatus(sessionId: string): Array<InterviewStep & { status: 'completed' | 'partial' | 'no-response' | 'second-chance' | 'current' }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    
    return allSteps.map((step, index) => {
      const response = session.stepResponses.get(step.step_id);
      let status: 'completed' | 'partial' | 'no-response' | 'second-chance' | 'current' = 'no-response';
      
      if (index === session.currentStep) {
        status = 'current';
      } else if (response?.completed) {
        status = 'completed';
      } else if (response?.hasResponse && response.responseQuality === 'partial') {
        status = 'partial';
      } else if (response?.secondChanceUsed) {
        status = 'second-chance';
      }
      
      return { ...step, status };
    });
  }

  // Get session statistics
  getSessionStats(sessionId: string): {
    totalSteps: number;
    completedSteps: number;
    currentStep: number;
    currentWindow: number;
    completionRate: number;
    interviewComplete: boolean;
    stepsWithNoResponse: number;
    stepsWithSecondChance: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        totalSteps: 0,
        completedSteps: 0,
        currentStep: 0,
        currentWindow: 0,
        completionRate: 0,
        interviewComplete: false,
        stepsWithNoResponse: 0,
        stepsWithSecondChance: 0
      };
    }

    const completedSteps = Array.from(session.stepResponses.values())
      .filter(response => response.completed).length;
    
    const stepsWithNoResponse = Array.from(session.stepResponses.values())
      .filter(response => !response.hasResponse).length;
    
    const stepsWithSecondChance = Array.from(session.stepResponses.values())
      .filter(response => response.secondChanceUsed).length;

    return {
      totalSteps: session.totalSteps,
      completedSteps,
      currentStep: session.currentStep,
      currentWindow: session.currentContextWindow,
      completionRate: (completedSteps / session.totalSteps) * 100,
      interviewComplete: session.interviewComplete,
      stepsWithNoResponse,
      stepsWithSecondChance
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

  // Mark step as complete after second chance with no response
  markStepCompleteAfterSecondChance(sessionId: string, stepId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const response = session.stepResponses.get(stepId);
    if (!response) return false;

    response.completed = true;
    response.secondChanceUsed = true;
    session.lastActivity = new Date();

    console.log(`[InterviewManager] Marked step ${stepId} as complete after second chance with no response`);
    return true;
  }

  // Check if we need to request next 1/3 section
  shouldRequestNextSection(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const currentWindowSteps = this.getCurrentContextWindow(sessionId);
    const allSteps = this.stepsCache.get(`${session.candidateId}_${session.requirementId}`) || [];
    const stepsPerWindow = Math.ceil(allSteps.length / 3);
    
    // Check if current window is complete and there are more sections
    const completedInWindow = currentWindowSteps.every(step => {
      const response = session.stepResponses.get(step.step_id);
      return response?.completed || false;
    });

    const hasMoreSections = session.currentContextWindow < 2;
    const shouldRequest = completedInWindow && hasMoreSections;
    
    console.log(`[InterviewManager] Should request next section: ${shouldRequest} (window ${session.currentContextWindow + 1}/3, completed: ${completedInWindow})`);
    return shouldRequest;
  }

  // Get current section info
  getCurrentSectionInfo(sessionId: string): {
    currentSection: number;
    totalSections: number;
    stepsInSection: number;
    completedInSection: number;
    sectionProgress: number;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        currentSection: 0,
        totalSections: 3,
        stepsInSection: 0,
        completedInSection: 0,
        sectionProgress: 0
      };
    }

    const currentWindowSteps = this.getCurrentContextWindow(sessionId);
    const completedInSection = currentWindowSteps.filter(step => {
      const response = session.stepResponses.get(step.step_id);
      return response?.completed || false;
    }).length;

    return {
      currentSection: session.currentContextWindow + 1,
      totalSections: 3,
      stepsInSection: currentWindowSteps.length,
      completedInSection,
      sectionProgress: currentWindowSteps.length > 0 ? (completedInSection / currentWindowSteps.length) * 100 : 0
    };
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
      const { default: db } = await import('@/lib/db');
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