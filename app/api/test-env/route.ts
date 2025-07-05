import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    console.log('[API/test-env] Checking environment variables...');
    
    const envVars = {
      LEMONFOX_LLM_KEY: process.env.LEMONFOX_LLM_KEY ? 'SET' : 'NOT SET',
      LEMONFOX_TTS_KEY: process.env.LEMONFOX_TTS_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };
    
    console.log('[API/test-env] Environment variables:', envVars);
    
    return NextResponse.json({ 
      success: true,
      environment: envVars
    });

  } catch (error) {
    console.error('[API/test-env] Error:', error);
    return NextResponse.json({ error: 'Failed to check environment' }, { status: 500 });
  }
} 