import { NextRequest, NextResponse } from 'next/server';
import db from '@/components/screening-interview/db';

// Define the interview state interface
interface InterviewState {
  currentStep: number;
  totalSteps: number;
  candidateId: number;
  requirementId: number;
  screeningContext: any;
  interviewSteps: any[];
  conversationHistory: any[];
  memory: {
    keyPoints: string[];
    candidateStrengths: string[];
    areasOfConcern: string[];
  };
  scores: {
    skillsMatch: number;
    experienceRelevance: number;
    communication: number;
    culturalFit: number;
  };
}

// Load screening steps from database
async function loadScreeningSteps(candidateId: number, requirementId: number) {
  try {
    const steps = db.prepare(`
      SELECT * FROM screening_interview_steps 
      WHERE candidate_id = ? AND requirement_id = ? 
      ORDER BY step_order
    `).all(candidateId, requirementId);
    
    console.log('[LangGraph] Loaded screening steps:', steps.length);
    return steps;
  } catch (error) {
    console.error('[LangGraph] Error loading screening steps:', error);
    return [];
  }
}

// Load screening context
async function loadScreeningContext(candidateId: number, requirementId: number) {
  try {
    const candidate = db.prepare('SELECT * FROM candidate_table WHERE candidate_id = ?').get(candidateId);
    const requirement = db.prepare('SELECT * FROM requirements_table WHERE requirement_id = ?').get(requirementId);
    const context = db.prepare('SELECT * FROM context_requirements_table WHERE requirement_id = ?').get(requirementId);
    
    return { candidate, requirement, context };
  } catch (error) {
    console.error('[LangGraph] Error loading screening context:', error);
    return {};
  }
}

// Update memory with conversation insights
async function updateMemory(
  candidateResponse: string, 
  agentResponse: string, 
  currentStep: any, 
  existingMemory: any
): Promise<any> {
  if (!candidateResponse) return existingMemory;

  const apiKey = process.env.LEMONFOX_LLM_KEY;
  if (!apiKey) return existingMemory;

  try {
    const memoryPrompt = `Analyze this conversation exchange and extract key insights:

Candidate Response: "${candidateResponse}"
Agent Response: "${agentResponse}"
Current Step: ${currentStep?.step_name || 'Unknown'}

Extract and categorize the following (return as JSON):
{
  "keyPoints": ["point1", "point2"],
  "strengths": ["strength1", "strength2"], 
  "concerns": ["concern1", "concern2"]
}

Only include new insights not already in the current memory.`;

    const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR analyst extracting insights from interview conversations.' },
          { role: 'user', content: memoryPrompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) return existingMemory;

    const result = await response.json();
    const insights = JSON.parse(result.choices?.[0]?.message?.content || '{}');
    
    return {
      keyPoints: [...existingMemory.keyPoints, ...(insights.keyPoints || [])],
      candidateStrengths: [...existingMemory.candidateStrengths, ...(insights.strengths || [])],
      areasOfConcern: [...existingMemory.areasOfConcern, ...(insights.concerns || [])]
    };
  } catch (error) {
    console.error('[LangGraph] Error updating memory:', error);
    return existingMemory;
  }
}

// Evaluate if we should move to next step
async function evaluateStepProgress(
  candidateResponse: string, 
  currentStep: any, 
  memory: any
): Promise<{ shouldMove: boolean; reason: string }> {
  if (!candidateResponse) {
    return { shouldMove: false, reason: 'No response yet' };
  }

  const apiKey = process.env.LEMONFOX_LLM_KEY;
  if (!apiKey) {
    return { shouldMove: true, reason: 'No API key, defaulting to move' };
  }

  try {
    const evaluationPrompt = `Evaluate if the interview should move to the next step:

Current Step: ${currentStep?.step_name || 'Unknown'}
Step Type: ${currentStep?.type || 'Unknown'}
Candidate Response: "${candidateResponse}"

Memory Context:
- Key Points: ${memory.keyPoints.join(', ') || 'None'}
- Strengths: ${memory.candidateStrengths.join(', ') || 'None'}
- Concerns: ${memory.areasOfConcern.join(', ') || 'None'}

Consider:
1. Has the candidate provided a sufficient response for this step?
2. Do we need to ask follow-up questions?
3. Is the response quality good enough to proceed?

Respond with "CONTINUE" if we should stay on this step, or "NEXT" if we should move to the next step.`;

    const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert HR interviewer evaluating interview progress.' },
          { role: 'user', content: evaluationPrompt }
        ],
        max_tokens: 50,
        temperature: 0.1,
        stream: false,
      }),
    });

    if (!response.ok) return { shouldMove: true, reason: 'API error, defaulting to move' };

    const result = await response.json();
    const decision = result.choices?.[0]?.message?.content?.trim().toUpperCase();

    return {
      shouldMove: decision === 'NEXT',
      reason: decision === 'NEXT' ? 'AI determined sufficient response' : 'AI determined need for follow-up'
    };
  } catch (error) {
    console.error('[LangGraph] Error evaluating step progress:', error);
    return { shouldMove: true, reason: 'Error, defaulting to move' };
  }
}

// Generate agent response based on current step and memory
async function generateAgentResponse(
  state: InterviewState,
  candidateResponse: string
): Promise<{ response: string; shouldMove: boolean; reason: string }> {
  const { currentStep, interviewSteps, memory, screeningContext } = state;
  
  if (currentStep >= interviewSteps.length) {
    // Interview complete, generate final message
    const finalPrompt = `Generate a comprehensive interview conclusion:

Candidate: ${screeningContext.candidate?.name || 'N/A'}
Role: ${screeningContext.requirement?.role_name || 'N/A'}

Memory Context:
- Key Points: ${memory.keyPoints.join(', ')}
- Strengths: ${memory.candidateStrengths.join(', ')}
- Concerns: ${memory.areasOfConcern.join(', ')}

Generate a professional closing message that:
1. Thanks the candidate for their time
2. Mentions the role they interviewed for
3. Explains next steps
4. Maintains a warm, professional tone

Keep it concise (2-3 sentences).`;

    const apiKey = process.env.LEMONFOX_LLM_KEY;
    if (!apiKey) {
      return {
        response: `Thank you for your time, ${screeningContext.candidate?.name || 'there'}. This concludes your screening interview. We'll be in touch with next steps.`,
        shouldMove: false,
        reason: 'Interview complete'
      };
    }

    try {
      const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are Sarah, a professional AI interviewer.' },
            { role: 'user', content: finalPrompt }
          ],
          max_tokens: 150,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const result = await response.json();
      return {
        response: result.choices?.[0]?.message?.content || 'Thank you for your time. We\'ll be in touch.',
        shouldMove: false,
        reason: 'Interview complete'
      };
    } catch (error) {
      console.error('[LangGraph] Error generating final response:', error);
      return {
        response: `Thank you for your time, ${screeningContext.candidate?.name || 'there'}. This concludes your screening interview. We'll be in touch with next steps.`,
        shouldMove: false,
        reason: 'Interview complete'
      };
    }
  }

  const currentStepData = interviewSteps[currentStep];
  
  // Evaluate if we should move to next step
  const evaluation = await evaluateStepProgress(candidateResponse, currentStepData, memory);
  
  if (evaluation.shouldMove) {
    // Move to next step
    const nextStepData = interviewSteps[currentStep + 1];
    if (nextStepData) {
      return {
        response: nextStepData.text,
        shouldMove: true,
        reason: evaluation.reason
      };
    }
  }

  // Generate follow-up or continuation response
  const followUpPrompt = `You are Sarah, a professional AI screening interviewer. 

Current Step: ${currentStepData.step_name}
Step Text: ${currentStepData.text}
Candidate Response: "${candidateResponse}"

Memory Context:
- Key Points: ${memory.keyPoints.join(', ') || 'None yet'}
- Candidate Strengths: ${memory.candidateStrengths.join(', ') || 'None yet'}
- Areas of Concern: ${memory.areasOfConcern.join(', ') || 'None yet'}

Instructions:
1. Acknowledge the candidate's response
2. Ask a follow-up question to dig deeper
3. Keep it conversational and professional (1-2 sentences)
4. Use the memory context to personalize your response

Respond as Sarah:`;

  const apiKey = process.env.LEMONFOX_LLM_KEY;
  if (!apiKey) {
    return {
      response: 'Thank you for that response. Could you tell me more about your experience?',
      shouldMove: false,
      reason: 'No API key, using fallback'
    };
  }

  try {
    const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      response: result.choices?.[0]?.message?.content || 'Thank you for that response. Could you tell me more?',
      shouldMove: false,
      reason: 'Follow-up question'
    };
  } catch (error) {
    console.error('[LangGraph] Error generating follow-up response:', error);
    return {
      response: 'Thank you for that response. Could you tell me more about your experience?',
      shouldMove: false,
      reason: 'Error, using fallback'
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/langgraph-conversation] Processing request...');
    
    const { 
      candidateMessage, 
      candidateId, 
      requirementId,
      conversationHistory = [],
      currentStep = 0
    } = await req.json();
    
    console.log('[API/screening/langgraph-conversation] Received data:', { 
      candidateMessage, 
      candidateId, 
      requirementId,
      historyLength: conversationHistory.length,
      currentStep 
    });

    if (!candidateMessage || !candidateId || !requirementId) {
      console.log('[API/screening/langgraph-conversation] Missing required parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Load screening steps and context
    const interviewSteps = await loadScreeningSteps(candidateId, requirementId);
    const screeningContext = await loadScreeningContext(candidateId, requirementId);
    
    if (interviewSteps.length === 0) {
      console.log('[API/screening/langgraph-conversation] No screening steps found');
      return NextResponse.json({ error: 'No screening steps found. Please generate questions first.' }, { status: 404 });
    }

    // Initialize or get existing memory
    const existingMemory = conversationHistory.length > 0 
      ? conversationHistory[conversationHistory.length - 1].memory || {
          keyPoints: [],
          candidateStrengths: [],
          areasOfConcern: []
        }
      : {
          keyPoints: [],
          candidateStrengths: [],
          areasOfConcern: []
        };

    // Generate agent response
    const agentResult = await generateAgentResponse({
      currentStep,
      totalSteps: interviewSteps.length,
      candidateId,
      requirementId,
      screeningContext,
      interviewSteps,
      conversationHistory,
      memory: existingMemory,
      scores: {
        skillsMatch: 0,
        experienceRelevance: 0,
        communication: 0,
        culturalFit: 0
      }
    }, candidateMessage);

    // Update memory with new insights
    const updatedMemory = await updateMemory(
      candidateMessage, 
      agentResult.response, 
      interviewSteps[currentStep], 
      existingMemory
    );

    // Determine next step
    const nextStep = agentResult.shouldMove ? currentStep + 1 : currentStep;
    const interviewComplete = nextStep >= interviewSteps.length;

    console.log('[API/screening/langgraph-conversation] Generated response:', {
      response: agentResult.response.substring(0, 100) + '...',
      shouldMove: agentResult.shouldMove,
      reason: agentResult.reason,
      nextStep,
      interviewComplete
    });

    return NextResponse.json({ 
      success: true,
      response: agentResult.response,
      currentStep: nextStep,
      totalSteps: interviewSteps.length,
      interviewComplete,
      memory: updatedMemory,
      shouldMove: agentResult.shouldMove,
      reason: agentResult.reason
    });

  } catch (error) {
    console.error('[API/screening/langgraph-conversation] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation response' }, { status: 500 });
  }
}