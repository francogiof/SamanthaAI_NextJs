// @ts-ignore
import extract from 'pdf-text-extract';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Step 1: Extract text from PDF (minimal, no extra packages)
async function extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
  return '';
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
    console.log('[API/parse-cv] Node version:', process.version);
    // Parse multipart form data (no extra packages)
    const formData = await req.formData();
    const file = formData.get('file');
    console.log('[API/parse-cv] file:', file);
    if (!file || !(file instanceof Blob)) {
      console.log('[API/parse-cv] No file uploaded or file is not a Blob:', file);
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    console.log('[API/parse-cv] arrayBuffer byteLength:', arrayBuffer.byteLength);
    const buffer = Buffer.from(arrayBuffer);
    console.log('[API/parse-cv] buffer length:', buffer.length);
    // Extract text using pdf-text-extract
    let extractedText = '';
    try {
      console.log('[API/parse-cv] Buffer type:', typeof buffer, 'Buffer.isBuffer:', Buffer.isBuffer(buffer));
      console.log('[API/parse-cv] Buffer length:', buffer.length);
      console.log('[API/parse-cv] Buffer first 32 bytes:', buffer.subarray(0, 32));
      console.log('[API/parse-cv] Buffer first 128 bytes (hex):', buffer.subarray(0, 128).toString('hex'));
      if (file && typeof file === 'object') {
        // @ts-ignore
        console.log('[API/parse-cv] Uploaded file name:', file.name, 'type:', file.type);
      }
      // Write buffer to a temp file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `cv-upload-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
      console.log('[API/parse-cv] Writing buffer to temp file:', tempFile);
      await fs.writeFile(tempFile, buffer);
      try {
        console.log('[API/parse-cv] Extracting text using pdf-text-extract from temp file...');
        extractedText = await new Promise((resolve, reject) => {
          extract(tempFile, { splitPages: false }, (err: Error | null, text: string[] | string | undefined) => {
            if (err) {
              console.error('[API/parse-cv] pdf-text-extract error:', err);
              reject(err);
            } else {
              const joined = Array.isArray(text) ? text.join('\n') : (text || '');
              console.log('[API/parse-cv] Extracted text length:', joined.length);
              console.log('[API/parse-cv] Extracted text (first 200 chars):', joined.slice(0, 200));
              resolve(joined);
            }
          });
        });
      } finally {
        // Always clean up temp file
        try {
          await fs.unlink(tempFile);
          console.log('[API/parse-cv] Temp file deleted:', tempFile);
        } catch (cleanupErr) {
          console.error('[API/parse-cv] Failed to delete temp file:', tempFile, cleanupErr);
        }
      }
      if (extractedText) {
        console.log('[API/parse-cv] extractedText length:', extractedText.length);
      } else {
        console.log('[API/parse-cv] extractedText is empty or falsy');
      }
    } catch (err) {
      console.error('[API/parse-cv] Error during pdf-text-extract extraction:', err);
      if (err instanceof Error && err.stack) {
        console.error('[API/parse-cv] Error stack:', err.stack);
      }
      extractedText = '';
    }
    if (!extractedText) {
      console.log('[API/parse-cv] Failed to extract text from PDF.');
      return NextResponse.json({ error: 'Failed to extract text from PDF.' }, { status: 500 });
    }
    console.log('[API/parse-cv] Successfully extracted text.');
    return NextResponse.json({ extractedText });
  } catch (error) {
    console.error('[API/parse-cv] Error (outer catch):', error);
    return NextResponse.json({ error: 'Failed to extract text from PDF.' }, { status: 500 });
  }
}
