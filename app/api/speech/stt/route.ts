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

    console.log('[API/speech/stt] Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified
    });

    if (audioFile.size === 0) {
      console.log('[API/speech/stt] Audio file is empty');
      return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
    }

    const apiKey = process.env.LEMONFOX_TTS_KEY;
    if (!apiKey) {
      console.error('[API/speech/stt] Missing LEMONFOX_TTS_KEY environment variable');
      return NextResponse.json({ error: 'STT service not configured' }, { status: 500 });
    }

    console.log('[API/speech/stt] Calling Lemonfox STT API...');
    
    // Create FormData for the Lemonfox API (OpenAI-compatible format)
    const lemonfoxFormData = new FormData();
    lemonfoxFormData.append('file', audioFile);
    lemonfoxFormData.append('model', 'whisper-1');
    lemonfoxFormData.append('language', 'en');
    
    console.log('[API/speech/stt] Sending request to Lemonfox with file:', audioFile.name, 'size:', audioFile.size);
    
    const response = await fetch('https://api.lemonfox.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Don't set Content-Type header - let the browser set it with boundary for FormData
      },
      body: lemonfoxFormData,
    });

    console.log('[API/speech/stt] Lemonfox response status:', response.status);
    console.log('[API/speech/stt] Lemonfox response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/speech/stt] Lemonfox API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'STT service error', 
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('[API/speech/stt] STT successful, full response:', result);
    console.log('[API/speech/stt] Transcribed text:', result.text);

    return NextResponse.json({ 
      success: true,
      text: result.text,
      language: result.language || 'en'
    });

  } catch (error) {
    console.error('[API/speech/stt] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 