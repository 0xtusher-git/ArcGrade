import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, handleOptions, corsHeaders } from '@/lib/api-middleware';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { allowed, retryAfter, headers } = checkRateLimit(req);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { ...headers, ...corsHeaders } }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      version: '1.0.0',
      network: 'Arc Testnet',
    },
    { headers: { ...headers, ...corsHeaders } }
  );
}
