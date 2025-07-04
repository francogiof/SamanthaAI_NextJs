import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Step 1: Extract text from PDF (minimal, no extra packages)
async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  // Use Lemon Fox LLM to extract text directly from PDF base64
  // (Lemon Fox can handle PDF base64 and extract text itself)
  return fileBuffer.toString('base64');
}

// Step 2: Prompt Lemon Fox LLM to parse the CV
async function callLemonFoxCVParserAgent(pdfBase64: string) {
  const apiKey = process.env.LEMONFOX_LLM_KEY;
  const prompt = `You are an AI CV parser. Extract the following fields from this CV text and return as JSON: {name, age (if available), linkedin, github, experience_years, education, personal_projects, introduction, cv_experience}`;
  const body = {
    prompt,
    pdf_base64: pdfBase64,
    output_format: 'json',
  };
  const res = await fetch('https://api.lemonfox.ai/v1/llm/cv-extract', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Lemon Fox LLM error');
  const data = await res.json();
  // Try to parse the profile JSON
  let profile = data.profile || data;
  if (typeof profile === 'string') {
    try { profile = JSON.parse(profile); } catch { profile = null; }
  }
  return profile;
}

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data (no extra packages)
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Step 1: Extract text (actually just base64 for LLM)
    const pdfBase64 = await extractTextFromPDF(buffer);
    // Step 2: Call LLM agent
    let profile = await callLemonFoxCVParserAgent(pdfBase64);
    // Step 3: Validate output
    const required = ['name'];
    const missingFields = required.filter(f => !(profile && profile[f]));
    if (!profile || missingFields.length > 0) {
      return NextResponse.json({ error: 'Missing required fields', missingFields }, { status: 400 });
    }
    // Step 4: Return structured profile
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[API/parse-cv] Error:', error);
    return NextResponse.json({ error: 'Failed to parse CV' }, { status: 500 });
  }
}
