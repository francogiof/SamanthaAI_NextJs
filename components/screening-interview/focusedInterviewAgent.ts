import db from '@/components/screening-interview/db';
import { protocolAgent } from '@/components/screening-interview/protocolAgent';

export class FocusedInterviewAgent {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LEMONFOX_LLM_KEY || '';
  }

  // Get all steps for candidate/requirement
  private getSteps(candidateId: number, requirementId: number): { text: string }[] {
    return db.prepare(`SELECT * FROM screening_interview_steps WHERE candidate_id = ? AND requirement_id = ? ORDER BY step_order`).all(candidateId, requirementId) as { text: string }[];
  }

  // Main method: present next question, handle interruptions
  async generateResponse(
    candidateId: number,
    requirementId: number,
    candidateMessage: string,
    currentStep: number,
    startTime?: number,
    maxDurationMs?: number
  ): Promise<{ response: string; nextStep: number; }> {
    const steps = this.getSteps(candidateId, requirementId);
    if (!steps || steps.length === 0) {
      return { response: 'No interview steps found. Please contact support.', nextStep: currentStep };
    }

    // Protocol enforcement
    const protocolState = {
      currentStep,
      totalSteps: steps.length,
      startTime: startTime || Date.now(),
      maxDurationMs: maxDurationMs || 30 * 60 * 1000, // default 30 min
      candidateMessage: candidateMessage || ''
    };
    const protocolResult = protocolAgent.enforceProtocol(protocolState);
    if (!protocolResult.allowContinue) {
      return {
        response: protocolResult.message || 'Interview ended by protocol.',
        nextStep: currentStep
      };
    }

    // If candidate asks a question (interruption)
    if (protocolAgent.isInterruption(candidateMessage)) {
      // Use LLM to answer candidate's question
      if (this.apiKey) {
        const systemPrompt = 'You are Samantha, a professional AI interviewer. Answer the candidate\'s question briefly and clearly. After answering, say you will continue with the interview.';
        const userPrompt = `Candidate asked: "${candidateMessage}"`;
        const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 100,
            temperature: 0.5,
            stream: false,
          }),
        });
        let aiResponse = 'Let me answer your question briefly.';
        if (response.ok) {
          const result: any = await response.json();
          if (result && result.choices && result.choices[0] && result.choices[0].message && typeof result.choices[0].message.content === 'string') {
            aiResponse = result.choices[0].message.content.trim() || aiResponse;
          }
        }
        // After answering, present the next interview question
        const nextStep = Math.min(currentStep, steps.length - 1);
        if (steps[nextStep] && typeof steps[nextStep].text === 'string') {
          return {
            response: aiResponse + '\n\nNow, let\'s continue. ' + steps[nextStep].text,
            nextStep: nextStep + 1
          };
        } else {
          return {
            response: aiResponse + '\n\nNow, let\'s continue with the interview.',
            nextStep: nextStep + 1
          };
        }
      } else {
        // Fallback: answer generically
        const nextStep = Math.min(currentStep, steps.length - 1);
        if (steps[nextStep] && typeof steps[nextStep].text === 'string') {
          return {
            response: 'That\'s a great question! I\'ll answer it as best I can.\n\nNow, let\'s continue. ' + steps[nextStep].text,
            nextStep: nextStep + 1
          };
        } else {
          return {
            response: 'That\'s a great question! I\'ll answer it as best I can.\n\nNow, let\'s continue with the interview.',
            nextStep: nextStep + 1
          };
        }
      }
    }

    // Otherwise, just present the next question
    if (currentStep < steps.length) {
      if (steps[currentStep] && typeof steps[currentStep].text === 'string') {
        return {
          response: steps[currentStep].text,
          nextStep: currentStep + 1
        };
      } else {
        return {
          response: 'Next interview question is missing. Please contact support.',
          nextStep: currentStep + 1
        };
      }
    } else {
      return {
        response: 'Thank you for completing the interview!',
        nextStep: currentStep
      };
    }
  }
}

export const focusedInterviewAgent = new FocusedInterviewAgent();