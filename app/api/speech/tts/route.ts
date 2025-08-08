import { NextRequest, NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

console.log('[API/speech/tts] Polly config:', {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? '***' : undefined,
});

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    console.log('[API/speech/tts] Processing TTS request...');
    const { text, voiceId = 'Joanna' } = await req.json();
    console.log('[API/speech/tts] Received text:', text, 'voiceId:', voiceId);
    if (!text) {
      console.log('[API/speech/tts] Missing text parameter');
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'pcm',
      VoiceId: voiceId,
      SampleRate: '16000',
    });
    let data;
    try {
      data = await polly.send(command);
    } catch (err: any) {
      console.error('[API/speech/tts] Polly error:', err);
      // Return full error details for debugging
      return NextResponse.json({ 
        error: 'Polly error', 
        details: err?.message || err, 
        code: err?.$metadata?.httpStatusCode || err?.code,
        stack: err?.stack || null,
        raw: JSON.stringify(err, Object.getOwnPropertyNames(err))
      }, { status: 500 });
    }
    if (!data.AudioStream) {
      console.error('[API/speech/tts] No audio stream returned from Polly.');
      return NextResponse.json({ error: 'No audio stream returned.' }, { status: 500 });
    }
    // Convert AudioStream to Buffer
    const audioBuffer = Buffer.from(await data.AudioStream.transformToByteArray());
    console.log('[API/speech/tts] TTS successful, audio size:', audioBuffer.byteLength, 'bytes');
    console.log('[API/speech/tts] Returning raw PCM audio. NOTE: <audio> tags cannot play this. Use Web Audio API on the frontend.');

    // Return raw PCM audio. Client must use Web Audio API to play this.
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/L16; rate=16000', // MIME for raw PCM
        'Content-Disposition': 'inline; filename="speech.pcm"',
        'X-Audio-Format': 'pcm16le',
        'X-TTS-Note': 'PCM format. Use Web Audio API, not <audio> tag.'
      },
    });
  } catch (error: any) {
    console.error('[API/speech/tts] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate speech', 
      details: error?.message || error, 
      stack: error?.stack || null,
      raw: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 });
  }
}