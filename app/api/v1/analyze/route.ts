import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchWalletData } from '@/lib/arcApi';
import { computeScore, getTrustLevel } from '@/lib/scoring';
import { checkRateLimit, handleOptions, corsHeaders } from '@/lib/api-middleware';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY ?? '' });

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  const { allowed, retryAfter, headers } = checkRateLimit(req);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { ...headers, ...corsHeaders } }
    );
  }

  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json(
        { error: 'Address required' },
        { status: 400, headers: { ...headers, ...corsHeaders } }
      );
    }

    const walletData = await fetchWalletData(address);
    const breakdown = computeScore(walletData);
    const trustLevel = getTrustLevel(breakdown.total);

    let verdict: string = trustLevel; // Fallback to simple trust level

    // Prompt for AI analysis
    const prompt = `You are an on-chain reputation analyst for Arc Testnet.
Wallet: ${address}
Trust Score: ${breakdown.total}/100
Trust Level: ${trustLevel}

Write exactly 1 sentence giving the overall verdict and recommendation for trusting this wallet based on its score of ${breakdown.total}/100. Do not use markdown.`;

    try {
      if (process.env.CLAUDE_API_KEY) {
        const msg = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 150,
          messages: [{ role: 'user', content: prompt }],
        });
        verdict = (msg.content[0] as { text: string }).text.trim();
      }
    } catch {
      // Ignore AI errors and just use simple trust level as verdict
      verdict = `This wallet has a trust level of "${trustLevel}" with a score of ${breakdown.total}/100.`;
    }

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
          activityScore: breakdown.avgValueScore,
        },
      },
      { headers: { ...headers, ...corsHeaders } }
    );
  } catch (err) {
    console.error('/api/v1/analyze error:', err);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500, headers: { ...headers, ...corsHeaders } }
    );
  }
}
