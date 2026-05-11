'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/hooks/useWallet';
import { getBadge, shortenAddress, getScoreColor } from '@/lib/scoring';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  txCount: number;
  badge: { label: string; emoji: string; cls: string };
  trust: string;
}

export default function LeaderboardPage() {
  const [wallets, setWallets] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRank, setUserRank] = useState<number | null>(null);
  const { address } = useWallet();

  useEffect(() => {
    const url = address ? `/api/leaderboard?address=${address}` : '/api/leaderboard';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setWallets(data.wallets);
        setUserRank(data.userRank);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [address]);

  const rankMedal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <Navbar />
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="section-tag mx-auto">🏆 Hall of Fame</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Top Trusted Wallets
          </h1>
          {userRank && (
            <div className="mb-6 inline-block glass-card px-6 py-2 border-teal-light/30">
              <span className="text-white/60 text-sm">Your Current Position:</span>
              <span className="ml-2 text-xl font-black text-teal-light">Rank #{userRank}</span>
            </div>
          )}
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            The most reputable wallets on Arc Testnet, ranked by AI-verified trust score.
          </p>
        </div>

        {/* Podium: top 3 */}
        {!loading && wallets.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-10 items-end">
            {/* 2nd place */}
            <div className="glass-card-hover p-6 text-center animate-fade-in-up delay-200">
              <div className="text-3xl mb-2">🥈</div>
              <div className="text-2xl font-black" style={{ color: '#c0c0c0' }}>{wallets[1].score}</div>
              <div className="text-white/50 text-xs font-mono mt-1">{shortenAddress(wallets[1].address)}</div>
              <div className={`badge ${wallets[1].badge.cls} mt-3 mx-auto`}>{wallets[1].badge.emoji} {wallets[1].badge.label}</div>
            </div>

            {/* 1st place */}
            <div className="glass-card p-6 text-center animate-fade-in-up delay-100 scale-105"
              style={{ borderColor: 'rgba(255,215,0,0.3)', boxShadow: '0 0 40px rgba(255,215,0,0.15)' }}>
              <div className="text-4xl mb-2">🥇</div>
              <div className="text-3xl font-black" style={{ color: '#ffd700' }}>{wallets[0].score}</div>
              <div className="text-white/50 text-xs font-mono mt-1">{shortenAddress(wallets[0].address)}</div>
              <div className={`badge ${wallets[0].badge.cls} mt-3 mx-auto`}>{wallets[0].badge.emoji} {wallets[0].badge.label}</div>
            </div>

            {/* 3rd place */}
            <div className="glass-card-hover p-6 text-center animate-fade-in-up delay-300">
              <div className="text-3xl mb-2">🥉</div>
              <div className="text-2xl font-black" style={{ color: '#cd7f32' }}>{wallets[2].score}</div>
              <div className="text-white/50 text-xs font-mono mt-1">{shortenAddress(wallets[2].address)}</div>
              <div className={`badge ${wallets[2].badge.cls} mt-3 mx-auto`}>{wallets[2].badge.emoji} {wallets[2].badge.label}</div>
            </div>
          </div>
        )}

        {/* Full Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up delay-400">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/40">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Wallet Address</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Txns</div>
            <div className="col-span-2 text-center">Badge</div>
            <div className="col-span-1 text-center">View</div>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-white/50">
                <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Scoring wallets on Arc Testnet…
              </div>
            </div>
          )}

          {error && (
            <div className="p-12 text-center text-red-400">
              <div className="text-2xl mb-2">⚠️</div>
              <div>{error}</div>
            </div>
          )}

          {!loading && !error && wallets.map((wallet, i) => (
            <div
              key={wallet.address}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="col-span-1 text-xl">{rankMedal(wallet.rank)}</div>
              <div className="col-span-4">
                <span className="font-mono text-sm text-white/80">{shortenAddress(wallet.address)}</span>
              </div>
              <div className="col-span-2 text-center">
                <span
                  className="text-xl font-black"
                  style={{ color: getScoreColor(wallet.score) }}
                >
                  {wallet.score}
                </span>
              </div>
              <div className="col-span-2 text-center text-white/60 text-sm">{wallet.txCount.toLocaleString()}</div>
              <div className="col-span-2 text-center">
                <span className={`badge ${wallet.badge.cls}`}>{wallet.badge.emoji} {wallet.badge.label}</span>
              </div>
              <div className="col-span-1 text-center">
                <Link
                  href={`/score/${wallet.address}`}
                  className="text-teal-light hover:text-white transition-colors text-sm"
                  aria-label={`View score for ${wallet.address}`}
                >
                  →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <p className="text-center text-white/30 text-sm mt-6">
          Scores are computed from Arc Testnet on-chain data · Updated on every analysis
        </p>
      </div>
    </div>
  );
}
