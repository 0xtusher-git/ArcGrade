import { NextRequest, NextResponse } from 'next/server';
import { fetchWalletData } from '@/lib/arcApi';
import { computeScore } from '@/lib/scoring';
import { checkRateLimit, handleOptions, corsHeaders } from '@/lib/api-middleware';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { allowed, retryAfter, headers } = checkRateLimit(req);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { ...headers, ...corsHeaders } }
    );
  }

  try {
    const address = params.address;
    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400, headers: { ...headers, ...corsHeaders } }
      );
    }

    const walletData = await fetchWalletData(address);
    const breakdown = computeScore(walletData);

    const minimumScoreRequired = 70;
    const trusted = breakdown.total >= minimumScoreRequired;

    return NextResponse.json(
      {
        address,
        trusted,
        score: breakdown.total,
        minimumScoreRequired,
      },
      { headers: { ...headers, ...corsHeaders } }
    );
  } catch (err) {
    console.error('/api/v1/trusted error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { ...headers, ...corsHeaders } }
    );
  }
}
