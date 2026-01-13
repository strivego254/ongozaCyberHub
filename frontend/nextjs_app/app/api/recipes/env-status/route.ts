import { NextResponse } from 'next/server';
import { validateAIEnvironment } from '@/lib/env';

export async function GET() {
  try {
    const status = validateAIEnvironment();
    return NextResponse.json({
      grok: status.hasGrok,
      llama: status.hasLlama,
      supabase: status.supabaseConfigured
    });
  } catch (error) {
    // Return status even if validation fails
    return NextResponse.json({
      grok: !!process.env.GROK_API_KEY,
      llama: !!process.env.LLAMA_ENDPOINT,
      supabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
    });
  }
}
