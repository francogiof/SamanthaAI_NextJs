import { interviewManager, InterviewStep, StepResponse } from './interviewManager';

export interface AgentResponse {
  response: string;
  shouldMove: boolean;
  reason: string;
  stepCompleted: boolean;
  needsFollowUp: boolean;
  needsSecondChance: boolean;
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
        needsFollowUp: false,
        needsSecondChance: false
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

    // If no response, check if we need to give second chance
    if (stepResponse && interviewManager.needsSecondChance(sessionId, currentStep.step_id)) {
      return this.giveSecondChance(sessionId, currentStep, stepResponse);
    }

    // If no response and second chance already used, move to next step
    if (stepResponse && stepResponse.secondChanceUsed && !stepResponse.hasResponse) {
      // Mark the step as complete since second chance was used
      interviewManager.markStepCompleteAfterSecondChance(sessionId, currentStep.step_id);
      interviewManager.moveToNextStep(sessionId);
      
      const nextStep = interviewManager.getCurrentStep(sessionId);
      if (nextStep.step) {
        return {
          response: `I understand this topic might not be familiar to you. Let's move on to the next question: ${nextStep.step.text}`,
          shouldMove: true,
          reason: 'No response after second chance, moving to next step',
          stepCompleted: true,
          needsFollowUp: false,
          needsSecondChance: false
        };
      } else {
        return this.generateCompletionResponse(interviewManager.getSession(sessionId)!);
      }
    }

    // Ask the current step question
    return this.askCurrentStep(sessionId, currentStep, stepResponse);
  }

  // Give second chance to candidate
  private giveSecondChance(
    sessionId: string,
    step: InterviewStep,
    stepResponse: StepResponse | null
  ): AgentResponse {
    interviewManager.useSecondChance(sessionId, step.step_id);
    
    // Generate more natural second chance messages
    const secondChanceMessages = [
      `I'd love to hear your thoughts on this. Could you share your experience with ${step.step_name.toLowerCase()}?`,
      `Take your time with this one. What can you tell me about ${step.step_name.toLowerCase()}?`,
      `This is an important area to explore. How would you approach ${step.step_name.toLowerCase()}?`,
      `I'm curious about your perspective on this. Could you elaborate on ${step.step_name.toLowerCase()}?`,
      `Let me rephrase that - what's your experience with ${step.step_name.toLowerCase()}?`
    ];
    
    const randomMessage = secondChanceMessages[Math.floor(Math.random() * secondChanceMessages.length)];

    return {
      response: randomMessage,
      shouldMove: false,
      reason: 'Giving second chance for no response',
      stepCompleted: false,
      needsFollowUp: false,
      needsSecondChance: true
    };
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

    console.log(`[FocusedInterviewAgent] Response quality: ${quality}, followUpCount: ${stepResponse?.followUpCount || 0}`);

    // Check if response is complete
    if (quality === 'complete') {
      // Move to next step
      interviewManager.moveToNextStep(sessionId);
      
      const nextStep = interviewManager.getCurrentStep(sessionId);
      if (nextStep.step) {
        return {
          response: `Thank you for that answer. Now let's move to the next question: ${nextStep.step.text}`,
          shouldMove: true,
          reason: 'Response complete, moving to next step',
          stepCompleted: true,
          needsFollowUp: false,
          needsSecondChance: false
        };
      } else {
        return this.generateCompletionResponse(interviewManager.getSession(sessionId)!);
      }
    }

    // Response is partial, check if we should follow up (only once)
    if (stepResponse && interviewManager.needsFollowUp(sessionId, step.step_id)) {
      interviewManager.incrementFollowUp(sessionId, step.step_id);
      return this.generateFollowUp(sessionId, step, candidateResponse);
    }

    // Max follow-ups reached or no follow-up needed, move to next step
    interviewManager.moveToNextStep(sessionId);
    const nextStep = interviewManager.getCurrentStep(sessionId);
    if (nextStep.step) {
      return {
        response: `Thank you for your response. Let's continue with the next question: ${nextStep.step.text}`,
        shouldMove: true,
        reason: 'Moving to next step after response',
        stepCompleted: false,
        needsFollowUp: false,
        needsSecondChance: false
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
          response: `Let's continue with the next question: ${nextStep.step.text}`,
          shouldMove: true,
          reason: 'Step already answered, moving to next',
          stepCompleted: false,
          needsFollowUp: false,
          needsSecondChance: false
        };
      }
    }

    return {
      response: step.text,
      shouldMove: false,
      reason: 'Asking current step question',
      stepCompleted: false,
      needsFollowUp: false,
      needsSecondChance: false
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
        needsFollowUp: false,
        needsSecondChance: false
      };
    }

    if (!this.apiKey) {
      return {
        response: `Thank you for sharing that. Could you tell me more specifically about ${step.step_name.toLowerCase()}?`,
        shouldMove: false,
        reason: 'No API key, using fallback follow-up',
        stepCompleted: false,
        needsFollowUp: true,
        needsSecondChance: false
      };
    }

    try {
      const followUpPrompt = `You are Sarah, a professional AI interviewer conducting a structured screening interview.

IMPORTANT: You must stay strictly on topic and focus only on completing the current interview question. Do not change subjects or ask unrelated questions.

Current Step: ${step.step_name}
Original Question: "${step.text}"
Candidate's Response: "${candidateResponse}"

Generate a follow-up question that:
1. Acknowledges their response briefly
2. Asks for more specific details related to the EXACT same topic as the original question
3. Helps complete the information needed for this specific step
4. Is conversational but professional (1-2 sentences)
5. Stays focused on the original question topic

DO NOT ask about different topics or change the subject. Focus only on getting a complete response for this specific step.
DO NOT ask generic questions like "tell me more about your experience" - be specific to the question topic.`;

      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Sarah, a professional AI interviewer. Stay focused on the current question topic only and be specific.' },
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
        response: result.choices?.[0]?.message?.content || `Thank you for sharing that. Could you tell me more specifically about ${step.step_name.toLowerCase()}?`,
        shouldMove: false,
        reason: 'Follow-up question',
        stepCompleted: false,
        needsFollowUp: true,
        needsSecondChance: false
      };
    } catch (error) {
      console.error('[FocusedInterviewAgent] Error generating follow-up:', error);
      return {
        response: `Thank you for sharing that. Could you tell me more specifically about ${step.step_name.toLowerCase()}?`,
        shouldMove: false,
        reason: 'Error, using fallback follow-up',
        stepCompleted: false,
        needsFollowUp: true,
        needsSecondChance: false
      };
    }
  }

  // Assess response quality
  private async assessResponseQuality(
    candidateResponse: string,
    step: InterviewStep
  ): Promise<'partial' | 'complete'> {
    if (!this.apiKey) {
      // More lenient heuristic fallback - if response has substantial content, consider it complete
      return candidateResponse.length > 30 ? 'complete' : 'partial';
    }

    try {
      const qualityPrompt = `Assess the quality of this candidate response for an interview question:

Question: "${step.text}"
Response: "${candidateResponse}"

Evaluate if the response is:
- COMPLETE: Provides a reasonable answer to the question, even if brief
- PARTIAL: Provides very little information or doesn't address the question at all

Guidelines:
- If the candidate provides ANY relevant information about the topic, mark as COMPLETE
- Only mark as PARTIAL if the response is completely off-topic or provides no useful information
- Be lenient - this is a screening interview, not a detailed technical assessment
- If the candidate mentions their experience, skills, or provides examples, mark as COMPLETE

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
            { role: 'system', content: 'You are an expert HR interviewer. Be lenient in assessing responses - if the candidate provides any relevant information, mark as COMPLETE.' },
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
      
      console.log(`[FocusedInterviewAgent] Response quality assessment: ${assessment} for response: "${candidateResponse.substring(0, 100)}..."`);
      
      return assessment === 'COMPLETE' ? 'complete' : 'partial';
    } catch (error) {
      console.error('[FocusedInterviewAgent] Error assessing response quality:', error);
      // More lenient fallback
      return candidateResponse.length > 30 ? 'complete' : 'partial';
    }
  }

  // Generate completion response
  private generateCompletionResponse(session: any): AgentResponse {
    const stats = interviewManager.getSessionStats(session.sessionId);
    
    const completionMessage = `Thank you for completing the screening interview! 

You've answered ${stats.completedSteps} out of ${stats.totalSteps} questions (${Math.round(stats.completionRate)}% completion rate).

${stats.stepsWithNoResponse > 0 ? `Note: ${stats.stepsWithNoResponse} questions were not answered.` : ''}
${stats.stepsWithSecondChance > 0 ? `Note: ${stats.stepsWithSecondChance} questions required a second attempt.` : ''}

We'll review your responses and get back to you with next steps. Have a great day!`;

    return {
      response: completionMessage,
      shouldMove: false,
      reason: 'Interview complete',
      stepCompleted: false,
      needsFollowUp: false,
      needsSecondChance: false
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
    const sectionInfo = interviewManager.getCurrentSectionInfo(sessionId);

    return {
      currentWindow: session.currentContextWindow,
      totalWindows: 3,
      stepsInWindow: currentWindowSteps.length,
      incompleteSteps: incompleteSteps.length,
      windowProgress: ((currentWindowSteps.length - incompleteSteps.length) / currentWindowSteps.length) * 100,
      sectionInfo
    };
  }

  // Check if we should advance to next section
  shouldAdvanceToNextSection(sessionId: string): boolean {
    return interviewManager.shouldRequestNextSection(sessionId);
  }

  // Get section transition message
  getSectionTransitionMessage(sessionId: string): string {
    const sectionInfo = interviewManager.getCurrentSectionInfo(sessionId);
    const nextSection = sectionInfo.currentSection + 1;
    
    if (nextSection <= 3) {
      return `Great! We've completed section ${sectionInfo.currentSection} of 3. Let's move on to section ${nextSection} where we'll explore different aspects of your experience.`;
    } else {
      return "Excellent! We've completed all sections of the interview. Let me ask you a few final questions to wrap up.";
    }
  }

  // Get all steps with status for UI indicators
  getAllStepsWithStatus(sessionId: string) {
    return interviewManager.getAllStepsWithStatus(sessionId);
  }
}

// Export singleton instance
export const focusedInterviewAgent = new FocusedInterviewAgent(); 