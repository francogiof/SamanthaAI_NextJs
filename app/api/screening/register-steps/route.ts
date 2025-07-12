import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { SCREENING_SCRIPT_TEMPLATE, ScreeningStepScript } from '../../../../prompts/screeningScriptTemplate';

async function completePlaceholdersWithAI(text: string, data: Record<string, any>, stepInfo: any) {
  const apiKey = process.env.LEMONFOX_LLM_KEY;
  if (!apiKey) {
    console.log('[API/screening/register-steps] No LLM API key, using fallback placeholder replacement');
    return replacePlaceholders(text, data);
  }

  try {
    // Build context for AI
    const context = {
      candidate: data.candidate_info,
      job: data.job_offer_info,
      context: data.context_role_info,
      company: data.company_info,
      step: stepInfo
    };

    const systemPrompt = `You are an expert HR interviewer creating a professional screening interview script. Your task is to complete interview script placeholders with natural, concise content.

CRITICAL RULES:
1. ONLY replace placeholders like [candidate_info.full_name] with actual values
2. DO NOT add extra content or explanations
3. DO NOT answer questions yourself - only ask them
4. Keep responses natural and conversational
5. Maintain the original question structure
6. Be concise - no long explanations
7. Use professional but warm tone

CONTEXT:
- Candidate: ${context.candidate?.name || 'N/A'}
- Role: ${context.job?.role_name || 'N/A'}
- Company: ${context.company?.name || 'TechCorp Solutions'}

STEP: ${stepInfo.step_name}

ORIGINAL TEXT: "${text}"

TASK: Replace ONLY the placeholders in brackets with actual values. Do not add anything else. Return the exact same text with only placeholder replacements.

EXAMPLE:
Input: "Hello [candidate_info.full_name], how are you today?"
Output: "Hello Franco Ccapa, how are you today?"

Return the completed text:`;

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
          { role: 'user', content: `Complete this interview text by replacing placeholders only: "${text}"` }
        ],
        max_tokens: 200,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.log('[API/screening/register-steps] LLM API error, using fallback');
      return replacePlaceholders(text, data);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      console.log('[API/screening/register-steps] No AI response, using fallback');
      return replacePlaceholders(text, data);
    }

    console.log(`[API/screening/register-steps] AI completed step ${stepInfo.id}:`, aiResponse.substring(0, 100) + '...');
    return aiResponse;

  } catch (error) {
    console.log('[API/screening/register-steps] AI completion failed, using fallback:', error);
    return replacePlaceholders(text, data);
  }
}

function replacePlaceholders(text: string, data: Record<string, any>) {
  return text.replace(/\[([\w.]+)\]/g, (_, key) => {
    const keys = key.split('.');
    let value = data;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) {
        // Provide sensible defaults for common placeholders
        if (key === 'candidate_info.full_name') return 'the candidate';
        if (key === 'job_offer_info.job_title') return 'this position';
        if (key === 'company_info.company_name') return 'our company';
        if (key === 'context_role_info.salary_range') return 'competitive salary';
        if (key === 'candidate_info.availability_date') return 'as soon as possible';
        if (key === 'candidate_info.salary_expectations') return 'competitive compensation';
        if (key === 'context_role_info.project_description') return 'our projects';
        if (key === 'context_role_info.ML_stack') return 'relevant technologies';
        if (key === 'job_offer_info.required_tools') return 'required tools';
        if (key === 'candidate_info.ml_frameworks_used') return 'ML frameworks';
        if (key === 'candidate_info.cloud_experience') return 'cloud platforms';
        if (key === 'candidate_info.project_highlights') return 'your projects';
        if (key === 'candidate_info.devops_tools') return 'deployment tools';
        if (key === 'candidate_info.last_job_description') return 'your previous role';
        if (key === 'candidate_info.company') return 'your previous company';
        return `[${key}]`;
      }
    }
    return typeof value === 'string' ? value : String(value);
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/register-steps] Starting request processing...');
    
    const { requirementId, candidateId } = await req.json();
    console.log('[API/screening/register-steps] Received data:', { requirementId, candidateId });
    
    if (!requirementId || !candidateId) {
      console.log('[API/screening/register-steps] Missing required parameters');
      return NextResponse.json({ error: 'Missing requirementId or candidateId' }, { status: 400 });
    }

    // Convert to integers for database queries
    const reqId = parseInt(requirementId, 10);
    const candId = parseInt(candidateId, 10);
    
    console.log('[API/screening/register-steps] Converted IDs:', { reqId, candId });
    
    if (isNaN(reqId) || isNaN(candId)) {
      console.log('[API/screening/register-steps] Invalid ID format');
      return NextResponse.json({ error: 'Invalid requirementId or candidateId format' }, { status: 400 });
    }

    // Check if the table has the correct schema
    console.log('[API/screening/register-steps] Checking table schema...');
    const tableInfo = db.prepare("PRAGMA table_info(screening_interview_steps)").all();
    console.log('[API/screening/register-steps] Table schema:', tableInfo);
    
    // Check if candidate_id column exists
    const hasCandidateId = tableInfo.some((col: any) => col.name === 'candidate_id');
    console.log('[API/screening/register-steps] Has candidate_id column:', hasCandidateId);
    
    // Check if step_name column exists
    const hasStepName = tableInfo.some((col: any) => col.name === 'step_name');
    console.log('[API/screening/register-steps] Has step_name column:', hasStepName);
    
    if (!hasCandidateId) {
      console.log('[API/screening/register-steps] Adding candidate_id column to table...');
      try {
        db.prepare('ALTER TABLE screening_interview_steps ADD COLUMN candidate_id TEXT').run();
        console.log('[API/screening/register-steps] Successfully added candidate_id column');
      } catch (error) {
        console.log('[API/screening/register-steps] Error adding candidate_id column:', error);
      }
    }
    
    if (!hasStepName) {
      console.log('[API/screening/register-steps] Adding step_name column to table...');
      try {
        db.prepare('ALTER TABLE screening_interview_steps ADD COLUMN step_name TEXT').run();
        console.log('[API/screening/register-steps] Successfully added step_name column');
      } catch (error) {
        console.log('[API/screening/register-steps] Error adding step_name column:', error);
      }
    }

    // Fetch candidate, requirement, and context data
    console.log('[API/screening/register-steps] Fetching data from database...');
    const candidate = db.prepare('SELECT * FROM candidate_table WHERE candidate_id = ?').get(candId);
    const requirement = db.prepare('SELECT * FROM requirements_table WHERE requirement_id = ?').get(reqId);
    const context = db.prepare('SELECT * FROM context_requirements_table WHERE requirement_id = ?').get(reqId);
    
    console.log('[API/screening/register-steps] Fetched data:', {
      candidate: candidate ? 'Found' : 'Not found',
      requirement: requirement ? 'Found' : 'Not found',
      context: context ? 'Found' : 'Not found'
    });

    // Compose data for placeholder replacement
    let company = null;
    if (requirement && typeof requirement === 'object' && 'company_id' in requirement && requirement.company_id) {
      company = db.prepare('SELECT * FROM company_table WHERE company_id = ?').get(requirement.company_id);
      console.log('[API/screening/register-steps] Company data:', company ? 'Found' : 'Not found');
    }
    
    const data = {
      candidate_info: candidate,
      job_offer_info: requirement,
      context_role_info: context,
      company_info: company,
    };
    
    console.log('[API/screening/register-steps] Data object prepared for placeholders');

    // Remove existing steps for this requirement and candidate (if any)
    console.log('[API/screening/register-steps] Removing existing steps...');
    try {
      const deleteResult = db.prepare('DELETE FROM screening_interview_steps WHERE requirement_id = ? AND candidate_id = ?').run(reqId, candId);
      console.log('[API/screening/register-steps] Delete result:', deleteResult);
    } catch (error) {
      console.log('[API/screening/register-steps] Error during delete:', error);
    }

    // Insert all steps from the template, completing placeholders with AI
    console.log('[API/screening/register-steps] Preparing to insert steps...');
    console.log('[API/screening/register-steps] Template has', SCREENING_SCRIPT_TEMPLATE.length, 'steps');
    
    const insertStmt = db.prepare(`
      INSERT INTO screening_interview_steps 
      (requirement_id, candidate_id, step_order, step_name, type, focus, includes, text, notes, fallback_if_missing)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Process steps sequentially without transaction since we need async AI calls
    let insertedCount = 0;
    for (let idx = 0; idx < SCREENING_SCRIPT_TEMPLATE.length; idx++) {
      const step = SCREENING_SCRIPT_TEMPLATE[idx];
      console.log(`[API/screening/register-steps] Processing step ${idx}:`, { type: step.type, focus: step.focus, step_name: step.step_name });
      
      // Use AI to complete placeholders
      const stepInfo = {
        id: step.id,
        type: step.type,
        focus: step.focus,
        includes: step.includes,
        step_name: step.step_name
      };
      
      const completedText = await completePlaceholdersWithAI(step.text, data, stepInfo);
      console.log(`[API/screening/register-steps] Completed text for step ${idx}:`, completedText.substring(0, 100) + '...');
      
      try {
        const result = insertStmt.run(
          reqId,
          candId,
          idx,
          step.step_name,
          step.type,
          step.focus || null,
          step.includes ? JSON.stringify(step.includes) : null,
          completedText,
          step.notes || null,
          step.fallback_if_missing || null
        );
        insertedCount++;
        console.log(`[API/screening/register-steps] Successfully inserted step ${idx}, result:`, result);
      } catch (error) {
        console.log(`[API/screening/register-steps] Error inserting step ${idx}:`, error);
      }
    }
    console.log(`[API/screening/register-steps] Total steps inserted: ${insertedCount}`);
    
    // Verify the insertion
    const verifyCount = db.prepare('SELECT COUNT(*) as count FROM screening_interview_steps WHERE requirement_id = ? AND candidate_id = ?').get(reqId, candId) as { count: number } | undefined;
    console.log('[API/screening/register-steps] Verification - steps in database:', verifyCount);

    console.log('[API/screening/register-steps] Request completed successfully');
    return NextResponse.json({ success: true, steps: verifyCount?.count || 0 });
  } catch (error) {
    console.error('[API/screening/register-steps] Error:', error);
    return NextResponse.json({ error: 'Failed to register screening steps' }, { status: 500 });
  }
} 