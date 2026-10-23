'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, getBadge, getScoreColor } from '@/lib/scoring';
import {
  User, Wallet, Link, Warning, CircleNotch, Medal, Brain,
  ArrowsLeftRight, CalendarBlank, Coins, XCircle, TrendUp, ArrowClockwise, ArrowRight,
} from '@phosphor-icons/react';

interface AnalysisResult {
  address: string;
  score: number;
  breakdown: {
    txScore: number; ageScore: number; consistencyScore: number;
    avgValueScore: number; reliabilityScore: number; total: number;
  };
  trustLevel: string;
  verdict: string;
  walletData: {
    txCount: number; failedTxCount: number; walletAgeInDays: number;
    avgTxValue: number; totalValueTransferred: string; isReal: boolean;
  };
}

const HISTORY_KEY = 'arctrust_history';

function loadHistory(address: string): { score: number; date: string }[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${address}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(address: string, score: number) {
  try {
    const history = loadHistory(address);
    history.push({ score, date: new Date().toLocaleDateString() });
    if (history.length > 10) history.splice(0, history.length - 10);
    localStorage.setItem(`${HISTORY_KEY}_${address}`, JSON.stringify(history));
  } catch {}
}

export default function MyScorePage() {
  const { address, isConnected, isConnecting, connect, isCorrectNetwork, switchNetwork } = useWallet();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ score: number; date: string }[]>([]);

  const analyze = async (addr: string) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000);
    try {
      const [analysisRes, rankRes] = await Promise.all([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr }),
          signal: controller.signal,
        }),
        fetch(`/api/leaderboard?address=${addr}`, { signal: controller.signal }),
      ]);

      const data = await analysisRes.json();
      const rankData = await rankRes.json();

      setResult(data);
      setUserRank(rankData.userRank);
      saveHistory(addr, data.score);
      setHistory(loadHistory(addr));
    } catch (e: any) {
      setError(e?.name === 'AbortError'
        ? 'Analysis timed out. Please retry.'
        : 'Could not analyze this wallet. Please retry.');
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      analyze(address);
      setHistory(loadHistory(address));
    }
  }, [address]);

  const shareOnX = () => {
    if (!result) return;
    const text = encodeURIComponent(
      `🔐 My Arc wallet trust score: ${result.score}/100 — ${result.trustLevel}\n\nCheck yours on ArcGrade 👇`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const badge = result ? getBadge(result.score) : null;

  return (
    <div className="min-h-screen px-4 pb-16 pt-32">
      <Navbar />
      <div className="mx-auto max-w-3xl">

        <div className="mb-10 text-center animate-fade-in">
          <div className="section-tag mx-auto"><User size={13} weight="duotone" /> My Score</div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
            Your Reputation
          </h1>
          <p className="text-slate-500">Connect your MetaMask wallet to see your Arc trust score.</p>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="glass-card p-12 text-center animate-scale-in">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-teal/10 text-teal">
              <Wallet size={26} weight="duotone" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Connect MetaMask</h2>
            <p className="mx-auto mb-8 max-w-sm text-slate-500">
              Connect your wallet to analyze your on-chain reputation and see your trust score.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary mx-auto flex text-base"
              id="my-score-connect-btn"
            >
              {isConnecting ? (
                <><CircleNotch size={18} weight="bold" className="animate-spin" /> Connecting…</>
              ) : (
                <><Link size={16} weight="bold" /> Connect MetaMask</>
              )}
            </button>
            <div className="mt-8 border-t border-white/[0.06] pt-6">
              <p className="mb-2 text-sm text-slate-600">Don&apos;t have MetaMask?</p>
              <a
                href="https://metamask.io/download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
              >
                Download MetaMask <ArrowRight size={13} weight="bold" />
              </a>
            </div>
          </div>
        )}

        {/* Wrong network */}
        {isConnected && !isCorrectNetwork && (
          <div className="glass-card p-10 text-center animate-scale-in">
            <div className="mb-4 flex justify-center"><Warning size={30} weight="duotone" className="text-red-400" /></div>
            <h2 className="mb-3 text-xl font-bold text-white">Wrong Network</h2>
            <p className="mb-6 text-slate-500">
              Please switch to <strong className="text-slate-200">Arc</strong> to see your score.
            </p>
            <button onClick={switchNetwork} className="btn-primary">Switch to Arc</button>
          </div>
        )}

        {/* Loading */}
        {isConnected && isCorrectNetwork && loading && (
          <div className="flex flex-col items-center gap-5 py-24">
            <CircleNotch size={40} weight="bold" className="animate-spin text-teal" />
            <p className="text-slate-400">Analyzing your wallet…</p>
          </div>
        )}

        {/* Error */}
        {isConnected && isCorrectNetwork && error && !loading && (
          <div className="glass-card p-8 text-center">
            <p className="mb-4 text-red-400">{error}</p>
            <button onClick={() => analyze(address!)} className="btn-primary mx-auto flex">
              <ArrowClockwise size={16} weight="bold" /> Retry
            </button>
          </div>
        )}

        {/* Result */}
        {isConnected && isCorrectNetwork && result && !loading && (
          <div className="space-y-6 animate-scale-in">

            <div className="glass-card p-8 text-center">
              <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
                <span className="font-mono text-sm text-slate-500">{shortenAddress(address!)}</span>
                {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
                {userRank && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                    <Medal size={15} weight="duotone" className="text-amber-400" /> Ranked #{userRank}
                  </span>
                )}
              </div>
              <div className="mb-6 flex justify-center">
                <ScoreRing score={result.score} size={220} />
              </div>

              <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-left">
                <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <Brain size={15} weight="duotone" /> AI Verdict
                </p>
                <p className="leading-relaxed text-slate-300">&ldquo;{result.verdict}&rdquo;</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={shareOnX} className="btn-primary">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </button>
                <button onClick={() => router.push(`/score/${address}`)} className="btn-secondary">
                  Full Dashboard <ArrowRight size={15} weight="bold" />
                </button>
                <button onClick={() => analyze(address!)} className="btn-secondary">
                  <ArrowClockwise size={15} weight="bold" /> Refresh
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: <ArrowsLeftRight size={20} weight="duotone" />, label: 'Total Txns', value: result.walletData.txCount.toLocaleString() },
                { icon: <CalendarBlank size={20} weight="duotone" />, label: 'Wallet Age', value: `${result.walletData.walletAgeInDays}d` },
                { icon: <Coins size={20} weight="duotone" />, label: 'Volume', value: `${result.walletData.totalValueTransferred} USDC` },
                { icon: <XCircle size={20} weight="duotone" />, label: 'Failed', value: result.walletData.failedTxCount },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <div className="mb-2.5 flex justify-center text-teal">{s.icon}</div>
                  <div className="break-all font-mono text-lg font-bold tabular-nums text-slate-100">{s.value}</div>
                  <div className="mt-1 text-xs text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Score history */}
            {history.length > 1 && (
              <div className="glass-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <TrendUp size={15} weight="duotone" /> Score History
                </h3>
                <div className="space-y-3">
                  {history.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/[0.06] py-2">
                      <span className="text-sm text-slate-500">{h.date}</span>
                      <span className="font-mono text-lg font-bold tabular-nums" style={{ color: getScoreColor(h.score) }}>
                        {h.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
