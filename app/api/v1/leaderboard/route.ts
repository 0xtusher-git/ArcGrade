import { NextRequest, NextResponse } from 'next/server';
import { fetchTopWallets, fetchWalletData } from '@/lib/arcApi';
import { computeScore, getTrustLevel } from '@/lib/scoring';
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

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const finalLimit = isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 50);

    const seedAddresses = await fetchTopWallets();

    const results = await Promise.all(
      seedAddresses.map(async (addr) => {
        const data = await fetchWalletData(addr);
        const breakdown = computeScore(data);
        const verdict = getTrustLevel(breakdown.total);
        return {
          address: addr,
          score: breakdown.total,
          verdict,
        };
      })
    );

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Format for response
    const leaderboard = results.slice(0, finalLimit).map((r, i) => ({
      rank: i + 1,
      address: r.address,
      score: r.score,
      verdict: r.verdict,
    }));

    return NextResponse.json(
      { leaderboard },
      { headers: { ...headers, ...corsHeaders } }
    );
  } catch (err) {
    console.error('/api/v1/leaderboard error:', err);
    return NextResponse.json(
      { error: 'Failed to load leaderboard' },
      { status: 500, headers: { ...headers, ...corsHeaders } }
    );
  }
}
