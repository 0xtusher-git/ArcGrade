import { NextRequest, NextResponse } from 'next/server';
import { fetchWalletData } from '@/lib/arcApi';
import { computeScore, getTrustLevel } from '@/lib/scoring';
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
    const verdict = getTrustLevel(breakdown.total);

    const now = new Date();

    return NextResponse.json(
      {
        address,
        score: breakdown.total,
        verdict,
        lastUpdated: now.toISOString(),
        breakdown: {
          transactionCount: breakdown.txScore,
          walletAge: breakdown.ageScore,
          consistency: breakdown.consistencyScore,
          reliability: breakdown.reliabilityScore,
          activityScore: breakdown.avgValueScore, // Maps to avgValueScore based on prompt
        },
      },
      { headers: { ...headers, ...corsHeaders } }
    );
  } catch (err) {
    console.error('/api/v1/score error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: { ...headers, ...corsHeaders } }
    );
  }
}
