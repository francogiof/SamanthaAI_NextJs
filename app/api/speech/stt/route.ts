import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/speech/stt] Processing STT request...');
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.log('[API/speech/stt] Missing audio file');
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    console.log('[API/speech/stt] Received audio file:', audioFile.name, 'size:', audioFile.size);

    const apiKey = process.env.LEMONFOX_LLM_KEY; // Using LLM key for STT
    if (!apiKey) {
      console.error('[API/speech/stt] Missing LEMONFOX_LLM_KEY environment variable');
      return NextResponse.json({ error: 'STT service not configured' }, { status: 500 });
    }

    // Convert audio file to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('[API/speech/stt] Calling Lemonfox STT API...');
    
    const response = await fetch('https://api.lemonfox.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: `data:${audioFile.type};base64,${audioBase64}`,
        model: 'whisper-1',
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/speech/stt] Lemonfox API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'STT service error', 
        details: errorText 
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('[API/speech/stt] STT successful, transcribed text:', result.text);

    return NextResponse.json({ 
      success: true,
      text: result.text,
      language: result.language || 'en'
    });

  } catch (error) {
    console.error('[API/speech/stt] Error:', error);
    return NextResponse.json({ error: 'Failed to transcribe speech' }, { status: 500 });
  }
} 