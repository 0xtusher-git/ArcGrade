import { NextResponse } from 'next/server';
import { fetchWalletData } from '@/lib/arcApi';
import { computeScore, getBadge, getTrustLevel } from '@/lib/scoring';

// Seeded demo addresses for the leaderboard
// In production these would come from indexing contract ScoreUpdated events
const SEED_ADDRESSES = [
  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  '0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5',
  '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
  '0xDead00000000000042069420694206942069Dead',
  '0x388C818CA8B9251b393131C08a736A67ccB19297',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
  '0x5a52E96BAcdaBb82fd05763E25335261B270Efcb',
  '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetAddress = searchParams.get('address')?.toLowerCase();

    // Combine seed addresses with target address if provided
    const allAddresses = [...SEED_ADDRESSES];
    if (targetAddress && !allAddresses.map(a => a.toLowerCase()).includes(targetAddress)) {
      allAddresses.push(targetAddress);
    }

    // Fetch and score all addresses in parallel
    const results = await Promise.all(
      allAddresses.map(async (addr) => {
        const data = await fetchWalletData(addr);
        const breakdown = computeScore(data);
        const badge = getBadge(breakdown.total);
        const trust = getTrustLevel(breakdown.total);
        return {
          address: addr,
          score: breakdown.total,
          txCount: data.txCount,
          badge,
          trust,
        };
      })
    );

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    const rankedResults = results.map((r, i) => ({
      ...r,
      rank: i + 1,
    }));

    // Find target rank if requested
    let targetRank = null;
    if (targetAddress) {
      targetRank = rankedResults.find(r => r.address.toLowerCase() === targetAddress)?.rank || null;
    }

    return NextResponse.json({ 
      wallets: rankedResults.slice(0, 10), // Only return top 10 for display
      userRank: targetRank
    });
  } catch (err) {
    console.error('/api/leaderboard error:', err);
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500 });
  }
}
