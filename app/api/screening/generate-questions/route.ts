import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface Requirement {
  requirement_id: string;
  role_name: string;
  responsibilities: string;
  required_skills: string;
  experience_required_years: number;
  company_id: number;
}

interface ContextRequirement {
  context_id: string;
  requirement_id: string;
  salary_range: string;
  contract_type: string;
  start_date: string;
  schedule: string;
  extra_notes: string;
  exclusion_criteria: string;
}

interface Candidate {
  candidate_id: string;
  name: string;
  experience_years: number;
  education: string;
  personal_projects: string;
  introduction: string;
  cv_experience: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API/screening/generate-questions] Processing question generation request...');
    
    const { requirementId, candidateId } = await req.json();
    console.log('[API/screening/generate-questions] Received params:', { requirementId, candidateId });
    
    if (!requirementId) {
      console.log('[API/screening/generate-questions] Missing requirementId');
      return NextResponse.json({ error: 'Missing requirementId' }, { status: 400 });
    }

    // Read requirement data
    console.log('[API/screening/generate-questions] Reading requirement data for ID:', requirementId);
    const requirement = db.prepare('SELECT * FROM requirements_table WHERE requirement_id = ?').get(requirementId) as Requirement | undefined;
    
    if (!requirement) {
      console.log('[API/screening/generate-questions] Requirement not found');
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Read context requirement data
    console.log('[API/screening/generate-questions] Reading context requirement data for ID:', requirementId);
    const contextRequirement = db.prepare('SELECT * FROM context_requirements_table WHERE requirement_id = ?').get(requirementId) as ContextRequirement | undefined;

    // Read candidate data (if provided)
    let candidate: Candidate | undefined;
    if (candidateId) {
      console.log('[API/screening/generate-questions] Reading candidate data for ID:', candidateId);
      candidate = db.prepare('SELECT * FROM candidate_table WHERE candidate_id = ?').get(candidateId) as Candidate | undefined;
    } else {
      // If no candidateId provided, try to find by user_id from requirement
      console.log('[API/screening/generate-questions] No candidateId provided, looking for candidate by user_id:', requirement.creator_user_id);
      candidate = db.prepare('SELECT * FROM candidate_table WHERE user_id = ?').get(requirement.creator_user_id) as Candidate | undefined;
    }

    console.log('[API/screening/generate-questions] Candidate found:', !!candidate);
    if (candidate) {
      console.log('[API/screening/generate-questions] Candidate name:', candidate.name);
      console.log('[API/screening/generate-questions] Candidate experience:', candidate.experience_years, 'years');
    }

    // Parse JSON fields if they exist
    let parsedRequirement = { ...requirement };
    let parsedContextRequirement = contextRequirement ? { ...contextRequirement } : null;
    let parsedCandidate = candidate ? { ...candidate } : null;
    
    try {
      // Handle required_skills - it might be a string or JSON array
      if (requirement.required_skills) {
        if (typeof requirement.required_skills === 'string') {
          // Check if it's JSON or just a string
          if (requirement.required_skills.startsWith('[') || requirement.required_skills.startsWith('{')) {
            try {
              parsedRequirement.required_skills = JSON.parse(requirement.required_skills);
            } catch {
              // If JSON parsing fails, treat as string
              parsedRequirement.required_skills = requirement.required_skills;
            }
          } else {
            // It's just a string, keep it as is
            parsedRequirement.required_skills = requirement.required_skills;
          }
        }
      }
      
      if (candidate?.education && typeof candidate.education === 'string') {
        try {
          parsedCandidate!.education = JSON.parse(candidate.education);
        } catch {
          // If JSON parsing fails, keep as string
          parsedCandidate!.education = candidate.education;
        }
      }
      if (candidate?.personal_projects && typeof candidate.personal_projects === 'string') {
        try {
          parsedCandidate!.personal_projects = JSON.parse(candidate.personal_projects);
        } catch {
          // If JSON parsing fails, keep as string
          parsedCandidate!.personal_projects = candidate.personal_projects;
        }
      }
      if (candidate?.cv_experience && typeof candidate.cv_experience === 'string') {
        try {
          parsedCandidate!.cv_experience = JSON.parse(candidate.cv_experience);
        } catch {
          // If JSON parsing fails, keep as string
          parsedCandidate!.cv_experience = candidate.cv_experience;
        }
      }
    } catch (parseError) {
      console.log('[API/screening/generate-questions] Error parsing JSON fields:', parseError);
    }

    // Build the prompt for question generation
    const systemPrompt = `You are an expert HR professional and technical recruiter specializing in creating comprehensive screening interview questions for technical roles.

Your task is to generate 10 static screening questions for a ${requirement.role_name} position. These questions should follow a structured approach to assess candidates thoroughly.

CONTEXT:
- Role: ${requirement.role_name}
- Responsibilities: ${requirement.responsibilities}
- Required Skills: ${Array.isArray(parsedRequirement.required_skills) ? parsedRequirement.required_skills.join(', ') : parsedRequirement.required_skills}
- Experience Required: ${requirement.experience_required_years} years
${contextRequirement ? `
- Salary Range: ${contextRequirement.salary_range}
- Contract Type: ${contextRequirement.contract_type}
- Schedule: ${contextRequirement.schedule}
- Extra Notes: ${contextRequirement.extra_notes}
- Exclusion Criteria: ${contextRequirement.exclusion_criteria}
` : ''}
${candidate ? `
- Candidate Name: ${candidate.name}
- Candidate Experience: ${candidate.experience_years} years
- Candidate Introduction: ${candidate.introduction}
` : ''}

QUESTION STRUCTURE REQUIREMENTS:
Generate exactly 10 questions with the following focus areas:

1. Q1: Introduction/Icebreaker - Personal introduction and initial rapport
2. Q2: Role Understanding - Understanding of the position and responsibilities
3. Q3: Technical Skills Assessment - Core technical skills evaluation
4. Q4: Experience Validation - Past work experience relevance
5. Q5: Problem-Solving Approach - How they approach technical challenges
6. Q6: Team Collaboration - Experience working in teams
7. Q7: Learning and Growth - Adaptability and continuous learning
8. Q8: Communication Skills - Ability to explain technical concepts
9. Q9: Work Conditions & Availability - Salary expectations, schedule, location
10. Q10: Motivation & Cultural Fit - Why they want this role and company fit

Each question should:
- Be clear and specific
- Allow for detailed responses
- Be relevant to the role requirements
- Help assess both technical and soft skills
- Be appropriate for a 15-30 minute screening call

OUTPUT FORMAT:
Return a JSON array with exactly 10 objects, each containing:
{
  "question_id": "Q1", "Q2", etc.,
  "question": "The actual question text",
  "type": "introduction|technical|experience|behavioral|logistics|motivation",
  "focus_area": "Brief description of what this question assesses",
  "ideal_answer_elements": ["key point 1", "key point 2", "key point 3"]
}

Make questions balanced between technical assessment, experience validation, and cultural fit.`;

    const apiKey = process.env.LEMONFOX_LLM_KEY;
    if (!apiKey) {
      console.error('[API/screening/generate-questions] Missing LEMONFOX_LLM_KEY environment variable');
      return NextResponse.json({ error: 'LLM service not configured' }, { status: 500 });
    }

    console.log('[API/screening/generate-questions] Calling Lemonfox LLM API for question generation...');
    
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
          { role: 'user', content: 'Generate the 10 screening questions for this role.' }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/screening/generate-questions] Lemonfox API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'LLM service error', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      console.error('[API/screening/generate-questions] No response from LLM');
      return NextResponse.json({ error: 'No response generated' }, { status: 500 });
    }

    console.log('[API/screening/generate-questions] AI response received, parsing JSON...');

    // Parse the JSON response
    let questions;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('[API/screening/generate-questions] Error parsing AI response:', parseError);
      console.error('[API/screening/generate-questions] Raw response:', aiResponse);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    if (!Array.isArray(questions) || questions.length !== 10) {
      console.error('[API/screening/generate-questions] Invalid questions format:', questions);
      return NextResponse.json({ error: 'Invalid questions format generated' }, { status: 500 });
    }

    console.log('[API/screening/generate-questions] Successfully generated', questions.length, 'questions');

    // Store questions in the database
    try {
      // First, verify the requirement exists to avoid foreign key constraint issues
      const requirementExists = db.prepare('SELECT requirement_id FROM requirements_table WHERE requirement_id = ?').get(requirementId);
      
      if (!requirementExists) {
        console.error('[API/screening/generate-questions] Requirement not found in database:', requirementId);
        throw new Error('Requirement not found in database');
      }

      // Clear existing questions for this requirement (optional - remove if you want to keep old questions)
      const deleteStmt = db.prepare('DELETE FROM screening_questions_table WHERE requirement_id = ?');
      deleteStmt.run(requirementId);
      console.log('[API/screening/generate-questions] Cleared existing questions for requirement:', requirementId);

      const insertStmt = db.prepare(`
        INSERT INTO screening_questions_table 
        (screening_question_id, requirement_id, question, type) 
        VALUES (?, ?, ?, ?)
      `);

      const insertTransaction = db.transaction((questions: any[]) => {
        const results = [];
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const questionId = `${requirementId}_${i + 1}`; // Generate unique ID
          const result = insertStmt.run(
            questionId,
            requirementId,
            q.question,
            q.type
          );
          results.push(result);
        }
        return results;
      });

      const insertResults = insertTransaction(questions);
      console.log('[API/screening/generate-questions] Questions stored in database:', insertResults.length, 'questions');

    } catch (dbError) {
      console.error('[API/screening/generate-questions] Database error:', dbError);
      // Continue even if database fails - we can still return the questions
    }

    console.log('[API/screening/generate-questions] Question generation completed successfully');
    return NextResponse.json({ 
      success: true,
      questions: questions,
      requirement: parsedRequirement,
      context: parsedContextRequirement,
      candidate: parsedCandidate,
      message: `Generated ${questions.length} screening questions for ${requirement.role_name}`
    });

  } catch (error) {
    console.error('[API/screening/generate-questions] Error:', error);
    return NextResponse.json({ error: 'Failed to generate screening questions' }, { status: 500 });
  }
} 