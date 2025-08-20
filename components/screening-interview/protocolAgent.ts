// ProtocolAgent: Handles interview protocol enforcement (time/step limits, interruptions)

export interface ProtocolState {
  currentStep: number;
  totalSteps: number;
  startTime: number;
  maxDurationMs: number;
  candidateMessage: string;
}

export interface ProtocolResult {
  allowContinue: boolean;
  endInterview: boolean;
  message?: string;
}

export class ProtocolAgent {
  // Enforce time and step limits
  enforceProtocol(state: ProtocolState): ProtocolResult {
    const now = Date.now();
    if (state.maxDurationMs && now - state.startTime > state.maxDurationMs) {
      return {
        allowContinue: false,
        endInterview: true,
        message: 'Interview time limit reached. Thank you for participating.'
      };
    }
    if (state.currentStep >= state.totalSteps) {
      return {
        allowContinue: false,
        endInterview: true,
        message: 'All interview steps completed. Thank you!'
      };
    }
    return {
      allowContinue: true,
      endInterview: false
    };
  }

  // Detect candidate interruptions (questions)
  isInterruption(candidateMessage: string): boolean {
    return candidateMessage && /\?$/.test(candidateMessage.trim());
  }
}

export const protocolAgent = new ProtocolAgent();
