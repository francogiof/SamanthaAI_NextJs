import { NextRequest, NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';

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
      OutputFormat: 'pcm', // Raw PCM for lowest latency
      VoiceId: voiceId,
      SampleRate: '16000', // 16kHz, standard for speech
    });
    const data = await polly.send(command);
    if (!data.AudioStream) {
      return NextResponse.json({ error: 'No audio stream returned.' }, { status: 500 });
    }
    // Convert AudioStream to Buffer
    const audioBuffer = Buffer.from(await data.AudioStream.transformToByteArray());
    console.log('[API/speech/tts] TTS successful, audio size:', audioBuffer.byteLength, 'bytes');

    // Return raw PCM audio. Client must use Web Audio API to play this.
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/L16; rate=16000', // MIME for raw PCM
        'Content-Disposition': 'inline; filename="speech.pcm"',
        'X-Audio-Format': 'pcm16le',
      },
    });

  } catch (error) {
    console.error('[API/speech/tts] Error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}