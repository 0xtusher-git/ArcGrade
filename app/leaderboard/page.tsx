'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useWallet } from '@/hooks/useWallet';
import { getBadge, shortenAddress, getScoreColor } from '@/lib/scoring';
import { Trophy, Medal, Warning, ArrowRight, CircleNotch } from '@phosphor-icons/react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  txCount: number;
  badge: { label: string; cls: string };
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

  const rankCell = (rank: number) => <span className="font-mono text-sm text-slate-500">#{rank}</span>;

  return (
    <div className="min-h-screen px-4 pb-16 pt-32">
      <Navbar />
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-12 text-center animate-fade-in">
          <div className="section-tag mx-auto"><Trophy size={13} weight="duotone" /> Hall of Fame</div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">Top Trusted Wallets</h1>
          {userRank && (
            <div className="glass-card mb-6 inline-block px-6 py-2">
              <span className="text-sm text-slate-500">Your position</span>
              <span className="ml-2 font-mono text-xl font-bold tabular-nums text-white">#{userRank}</span>
            </div>
          )}
          <p className="mx-auto max-w-xl text-lg text-slate-500">
            The most reputable wallets on Arc, ranked by AI-verified trust score.
          </p>
        </div>

        {/* Podium */}
        {!loading && wallets.length >= 3 && (
          <div className="mb-10 grid grid-cols-3 items-end gap-4">
            <div className="glass-card-hover animate-fade-in-up p-6 text-center delay-200">
              <div className="mb-3 flex justify-center"><Medal size={26} weight="duotone" className="text-slate-400" /></div>
              <div className="font-mono text-2xl font-bold tabular-nums text-slate-200">{wallets[1].score}</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{shortenAddress(wallets[1].address)}</div>
              <div className={`badge ${wallets[1].badge.cls} mx-auto mt-3`}>{wallets[1].badge.label}</div>
            </div>

            <div className="glass-card animate-fade-in-up scale-105 border-amber-400/25 p-6 text-center delay-100">
              <div className="mb-3 flex justify-center"><Medal size={34} weight="duotone" className="text-amber-400" /></div>
              <div className="font-mono text-3xl font-bold tabular-nums text-amber-400">{wallets[0].score}</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{shortenAddress(wallets[0].address)}</div>
              <div className={`badge ${wallets[0].badge.cls} mx-auto mt-3`}>{wallets[0].badge.label}</div>
            </div>

            <div className="glass-card-hover animate-fade-in-up p-6 text-center delay-300">
              <div className="mb-3 flex justify-center"><Medal size={26} weight="duotone" className="text-orange-400/70" /></div>
              <div className="font-mono text-2xl font-bold tabular-nums text-slate-200">{wallets[2].score}</div>
              <div className="mt-1 font-mono text-xs text-slate-500">{shortenAddress(wallets[2].address)}</div>
              <div className={`badge ${wallets[2].badge.cls} mx-auto mt-3`}>{wallets[2].badge.label}</div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="glass-card animate-fade-in-up overflow-hidden delay-400">
          <div className="grid grid-cols-12 gap-4 border-b border-white/[0.08] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Wallet</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Txns</div>
            <div className="col-span-2 text-center">Badge</div>
            <div className="col-span-1 text-center">View</div>
          </div>

          {loading && (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-slate-500">
                <CircleNotch size={22} weight="bold" className="animate-spin text-teal" />
                Scoring wallets on Arc…
              </div>
            </div>
          )}

          {error && (
            <div className="p-12 text-center text-red-400">
              <div className="mb-3 flex justify-center"><Warning size={24} weight="duotone" /></div>
              <div>{error}</div>
            </div>
          )}

          {!loading && !error && wallets.map((wallet, i) => (
            <div
              key={wallet.address}
              className="grid grid-cols-12 items-center gap-4 border-b border-white/[0.04] px-6 py-4 transition-colors hover:bg-white/[0.02] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="col-span-1">{rankCell(wallet.rank)}</div>
              <div className="col-span-4">
                <span className="font-mono text-sm text-slate-300">{shortenAddress(wallet.address)}</span>
              </div>
              <div className="col-span-2 text-center">
                <span className="font-mono text-xl font-bold tabular-nums" style={{ color: getScoreColor(wallet.score) }}>
                  {wallet.score}
                </span>
              </div>
              <div className="col-span-2 text-center font-mono text-sm tabular-nums text-slate-500">{wallet.txCount.toLocaleString()}</div>
              <div className="col-span-2 text-center">
                <span className={`badge ${wallet.badge.cls}`}>{wallet.badge.label}</span>
              </div>
              <div className="col-span-1 text-center">
                <Link
                  href={`/score/${wallet.address}`}
                  className="inline-flex text-slate-500 transition-colors hover:text-white"
                  aria-label={`View score for ${wallet.address}`}
                >
                  <ArrowRight size={16} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Scores are computed from Arc on-chain data · Updated on every analysis
        </p>
      </div>
    </div>
  );
}
