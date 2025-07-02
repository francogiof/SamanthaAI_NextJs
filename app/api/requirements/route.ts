import { NextRequest, NextResponse } from 'next/server';
import { listRequirements } from '@/lib/models/requirements';

export async function GET() {
  try {
    const requirements = listRequirements();
    return NextResponse.json({ requirements });
  } catch (error) {
    console.log('[API/requirements] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
