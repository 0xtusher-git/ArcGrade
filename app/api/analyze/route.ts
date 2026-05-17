import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { fetchWalletData } from '@/lib/arcApi';
import { computeScore, getTrustLevel } from '@/lib/scoring';

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY ?? '' });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400, headers: corsHeaders });

    // 1. Fetch on-chain data
    const walletData = await fetchWalletData(address);

    // 2. Compute score locally
    const breakdown = computeScore(walletData);
    const trustLevel = getTrustLevel(breakdown.total);

    // 3. Ask Claude for a human-readable verdict
    const prompt = `You are an on-chain reputation analyst for Arc Testnet (an EVM blockchain by Circle).

Wallet: ${address}
Transaction count: ${walletData.txCount}
Failed transactions: ${walletData.failedTxCount}
Wallet age: ${walletData.walletAgeInDays} days
Average transaction value: ${walletData.avgTxValue.toFixed(4)} USDC
Total value transferred: ${walletData.totalValueTransferred} USDC
Trust Score: ${breakdown.total}/100
Trust Level: ${trustLevel}

Score breakdown:
- Transaction history score: ${breakdown.txScore}/25
- Wallet age score: ${breakdown.ageScore}/20
- Consistency score: ${breakdown.consistencyScore}/20
- Avg value score: ${breakdown.avgValueScore}/20
- Reliability score: ${breakdown.reliabilityScore}/15

Write exactly 2 sentences in plain English explaining this wallet's reputation. 
Be specific, concise, and professional. Do NOT use markdown. Do NOT mention the scoring formula.
First sentence: describe the wallet's activity pattern.
Second sentence: give the overall verdict and recommendation for trusting this wallet.`;

    let verdict = '';
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      });
      verdict = (msg.content[0] as { text: string }).text.trim();
    } catch {
      // Fallback verdict if API fails
      verdict = `This wallet has ${walletData.txCount} transactions over ${walletData.walletAgeInDays} days on Arc Testnet. Based on its activity, it has been assigned a trust level of "${trustLevel}" with a score of ${breakdown.total}/100.`;
    }

    return NextResponse.json({
      address,
      score: breakdown.total,
      breakdown,
      trustLevel,
      verdict,
      walletData: {
        txCount: walletData.txCount,
        failedTxCount: walletData.failedTxCount,
        walletAgeInDays: walletData.walletAgeInDays,
        avgTxValue: walletData.avgTxValue,
        totalValueTransferred: walletData.totalValueTransferred,
        isReal: walletData.isReal,
        transactions: walletData.transactions.slice(0, 10), // Send last 10 for UI
      },
    }, { headers: corsHeaders });
  } catch (err) {
    console.error('/api/analyze error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500, headers: corsHeaders });
  }
}
