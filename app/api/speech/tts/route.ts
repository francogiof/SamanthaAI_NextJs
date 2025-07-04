import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('[API/speech/tts] Processing TTS request...');
    
    const { text, voice = 'sarah' } = await req.json();
    console.log('[API/speech/tts] Received text:', text, 'voice:', voice);
    
    if (!text) {
      console.log('[API/speech/tts] Missing text parameter');
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const apiKey = process.env.LEMONFOX_TTS_KEY;
    if (!apiKey) {
      console.error('[API/speech/tts] Missing LEMONFOX_TTS_KEY environment variable');
      return NextResponse.json({ error: 'TTS service not configured' }, { status: 500 });
    }

    console.log('[API/speech/tts] Calling Lemonfox TTS API...');
    
    const response = await fetch('https://api.lemonfox.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        voice: voice,
        response_format: 'mp3',
        model: 'tts-1',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/speech/tts] Lemonfox API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'TTS service error', 
        details: errorText 
      }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('[API/speech/tts] TTS successful, audio size:', audioBuffer.byteLength, 'bytes');

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('[API/speech/tts] Error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
} 