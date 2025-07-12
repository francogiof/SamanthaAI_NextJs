import { interviewManager, InterviewStep, StepResponse } from './interviewManager';

export interface AgentResponse {
  response: string;
  shouldMove: boolean;
  reason: string;
  stepCompleted: boolean;
  needsFollowUp: boolean;
}

export class FocusedInterviewAgent {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LEMONFOX_LLM_KEY || '';
  }

  // Generate focused agent response
  async generateResponse(
    sessionId: string,
    candidateResponse: string
  ): Promise<AgentResponse> {
    const session = interviewManager.getSession(sessionId);
    if (!session) {
      return {
        response: 'I apologize, but I cannot find your interview session. Please restart the interview.',
        shouldMove: false,
        reason: 'Session not found',
        stepCompleted: false,
        needsFollowUp: false
      };
    }

    const { step: currentStep, response: stepResponse } = interviewManager.getCurrentStep(sessionId);
    
    if (!currentStep) {
      return this.generateCompletionResponse(session);
    }

    // If candidate provided a response, analyze it
    if (candidateResponse.trim()) {
      return this.analyzeCandidateResponse(sessionId, currentStep, stepResponse, candidateResponse);
    }

    // If no response, ask the current step question
    return this.askCurrentStep(sessionId, currentStep, stepResponse);
  }

  // Analyze candidate response and decide next action
  private async analyzeCandidateResponse(
    sessionId: string,
    step: InterviewStep,
    stepResponse: StepResponse | null,
    candidateResponse: string
  ): Promise<AgentResponse> {
    // Record the response
    const quality = await this.assessResponseQuality(candidateResponse, step);
    interviewManager.recordResponse(sessionId, step.step_id, candidateResponse, quality);

    // Check if response is complete
    if (quality === 'complete') {
      // Move to next step
      interviewManager.moveToNextStep(sessionId);
      
      const nextStep = interviewManager.getCurrentStep(sessionId);
      if (nextStep.step) {
        return {
          response: nextStep.step.text,
          shouldMove: true,
          reason: 'Response complete, moving to next step',
          stepCompleted: true,
          needsFollowUp: false
        };
      } else {
        return this.generateCompletionResponse(interviewManager.getSession(sessionId)!);
      }
    }

    // Response is partial, check if we should follow up
    if (stepResponse && interviewManager.needsFollowUp(sessionId, step.step_id)) {
      interviewManager.incrementFollowUp(sessionId, step.step_id);
      return this.generateFollowUp(sessionId, step, candidateResponse);
    }

    // Max follow-ups reached, move to next step
    interviewManager.moveToNextStep(sessionId);
    const nextStep = interviewManager.getCurrentStep(sessionId);
    if (nextStep.step) {
      return {
        response: nextStep.step.text,
        shouldMove: true,
        reason: 'Max follow-ups reached, moving to next step',
        stepCompleted: false,
        needsFollowUp: false
      };
    } else {
      return this.generateCompletionResponse(interviewManager.getSession(sessionId)!);
    }
  }

  // Ask the current step question
  private askCurrentStep(
    sessionId: string,
    step: InterviewStep,
    stepResponse: StepResponse | null
  ): AgentResponse {
    // If this step already has a response, move to next
    if (stepResponse?.hasResponse) {
      interviewManager.moveToNextStep(sessionId);
      const nextStep = interviewManager.getCurrentStep(sessionId);
      if (nextStep.step) {
        return {
          response: nextStep.step.text,
          shouldMove: true,
          reason: 'Step already answered, moving to next',
          stepCompleted: false,
          needsFollowUp: false
        };
      }
    }

    return {
      response: step.text,
      shouldMove: false,
      reason: 'Asking current step question',
      stepCompleted: false,
      needsFollowUp: false
    };
  }

  // Generate follow-up question
  private async generateFollowUp(
    sessionId: string,
    step: InterviewStep,
    candidateResponse: string
  ): Promise<AgentResponse> {
    const session = interviewManager.getSession(sessionId);
    if (!session) {
      return {
        response: 'I apologize, but I cannot find your interview session.',
        shouldMove: false,
        reason: 'Session not found',
        stepCompleted: false,
        needsFollowUp: false
      };
    }

    if (!this.apiKey) {
      return {
        response: 'Thank you for that response. Could you provide more specific details about your experience?',
        shouldMove: false,
        reason: 'No API key, using fallback follow-up',
        stepCompleted: false,
        needsFollowUp: true
      };
    }

    try {
      const followUpPrompt = `You are Sarah, a professional AI interviewer. 

Current Step: ${step.step_name}
Original Question: "${step.text}"
Candidate's Response: "${candidateResponse}"

Generate a follow-up question that:
1. Acknowledges their response
2. Asks for more specific details or examples
3. Helps complete the information needed for this step
4. Is conversational and professional (1-2 sentences)

Focus on getting a complete response for this step.`;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Sarah, a professional AI interviewer.' },
            { role: 'user', content: followUpPrompt }
          ],
          max_tokens: 150,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      return {
        response: result.choices?.[0]?.message?.content || 'Could you provide more specific details?',
        shouldMove: false,
        reason: 'Follow-up question',
        stepCompleted: false,
        needsFollowUp: true
      };
    } catch (error) {
      console.error('[FocusedInterviewAgent] Error generating follow-up:', error);
      return {
        response: 'Thank you for that response. Could you provide more specific details about your experience?',
        shouldMove: false,
        reason: 'Error, using fallback follow-up',
        stepCompleted: false,
        needsFollowUp: true
      };
    }
  }

  // Assess response quality
  private async assessResponseQuality(
    candidateResponse: string,
    step: InterviewStep
  ): Promise<'partial' | 'complete'> {
    if (!this.apiKey) {
      // Simple heuristic fallback
      return candidateResponse.length > 50 ? 'complete' : 'partial';
    }

    try {
      const qualityPrompt = `Assess the quality of this candidate response for an interview question:

Question: "${step.text}"
Response: "${candidateResponse}"

Evaluate if the response is:
- COMPLETE: Provides sufficient detail, examples, and addresses the question fully
- PARTIAL: Provides some information but lacks detail, examples, or doesn't fully address the question

Respond with only "COMPLETE" or "PARTIAL".`;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert HR interviewer assessing response quality.' },
            { role: 'user', content: qualityPrompt }
          ],
          max_tokens: 10,
          temperature: 0.1,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      const assessment = result.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      return assessment === 'COMPLETE' ? 'complete' : 'partial';
    } catch (error) {
      console.error('[FocusedInterviewAgent] Error assessing response quality:', error);
      return candidateResponse.length > 50 ? 'complete' : 'partial';
    }
  }

  // Generate completion response
  private generateCompletionResponse(session: any): AgentResponse {
    const stats = interviewManager.getSessionStats(session.sessionId);
    
    const completionMessage = `Thank you for completing the screening interview! 

You've answered ${stats.completedSteps} out of ${stats.totalSteps} questions (${Math.round(stats.completionRate)}% completion rate).

We'll review your responses and get back to you with next steps. Have a great day!`;

    return {
      response: completionMessage,
      shouldMove: false,
      reason: 'Interview complete',
      stepCompleted: false,
      needsFollowUp: false
    };
  }

  // Get interview progress
  getProgress(sessionId: string) {
    return interviewManager.getSessionStats(sessionId);
  }

  // Get current context window info
  getContextWindowInfo(sessionId: string) {
    const session = interviewManager.getSession(sessionId);
    if (!session) return null;

    const currentWindowSteps = interviewManager.getCurrentContextWindow(sessionId);
    const incompleteSteps = interviewManager.getIncompleteSteps(sessionId);

    return {
      currentWindow: session.currentContextWindow,
      totalWindows: 3,
      stepsInWindow: currentWindowSteps.length,
      incompleteSteps: incompleteSteps.length,
      windowProgress: ((currentWindowSteps.length - incompleteSteps.length) / currentWindowSteps.length) * 100
    };
  }
}

// Export singleton instance
export const focusedInterviewAgent = new FocusedInterviewAgent(); 