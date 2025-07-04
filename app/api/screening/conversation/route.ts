import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/conversation] Processing conversation request...');
    
    const { 
      candidateMessage, 
      screeningContext, 
      conversationHistory,
      currentQuestion 
    } = await req.json();
    
    console.log('[API/screening/conversation] Received data:', { 
      candidateMessage, 
      hasContext: !!screeningContext,
      historyLength: conversationHistory?.length || 0,
      currentQuestion 
    });

    if (!candidateMessage || !screeningContext) {
      console.log('[API/screening/conversation] Missing required parameters');
      return NextResponse.json({ error: 'Missing candidateMessage or screeningContext' }, { status: 400 });
    }

    const apiKey = process.env.LEMONFOX_LLM_KEY;
    if (!apiKey) {
      console.error('[API/screening/conversation] Missing LEMONFOX_LLM_KEY environment variable');
      return NextResponse.json({ error: 'LLM service not configured' }, { status: 500 });
    }

    // Build the conversation context
    const roleName = screeningContext.requirement?.role_name || 'the position';
    const requiredSkills = screeningContext.requirement?.required_skills || 'relevant skills';
    const candidateName = screeningContext.candidate?.name || 'the candidate';
    const candidateExperience = screeningContext.candidate?.experience_years || 'their experience';

    // Create a comprehensive system prompt
    const systemPrompt = `You are Sarah, a professional AI screening interviewer for TechCorp Solutions. You are conducting a screening interview for the ${roleName} position.

CONTEXT:
- Role: ${roleName}
- Required Skills: ${requiredSkills}
- Candidate: ${candidateName} (${candidateExperience} years of experience)
- Interview Type: Initial screening to assess skills, experience, and cultural fit

YOUR ROLE:
- Be professional, friendly, and engaging
- Ask relevant technical and behavioral questions
- Assess the candidate's communication skills
- Provide constructive feedback when appropriate
- Keep responses concise (1-2 sentences)
- Be conversational, not robotic
- If the candidate asks about you, briefly mention you're an AI interviewer

CONVERSATION STYLE:
- Professional but warm
- Ask follow-up questions to dig deeper
- Acknowledge good answers with positive reinforcement
- If answers are vague, ask for specific examples
- Maintain a natural conversation flow

Current question focus: ${currentQuestion || 'General screening'}

Respond naturally to the candidate's message, keeping the conversation flowing and professional.`;

    // Build the conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.sender === 'agent' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: candidateMessage }
    ];

    console.log('[API/screening/conversation] Calling Lemonfox LLM API...');
    
    const response = await fetch('https://api.lemonfox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/screening/conversation] Lemonfox API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'LLM service error', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      console.error('[API/screening/conversation] No response from LLM');
      return NextResponse.json({ error: 'No response generated' }, { status: 500 });
    }

    console.log('[API/screening/conversation] AI response generated:', aiResponse);

    return NextResponse.json({ 
      success: true,
      response: aiResponse,
      usage: result.usage
    });

  } catch (error) {
    console.error('[API/screening/conversation] Error:', error);
    return NextResponse.json({ error: 'Failed to generate conversation response' }, { status: 500 });
  }
} 