'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, getBadge, getScoreColor } from '@/lib/scoring';

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
    // Keep last 10
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
  const [history, setHistory] = useState<{ score: number; date: string }[]>([]);

  const analyze = async (addr: string) => {
    setLoading(true);
    try {
      // Parallel fetch analysis and leaderboard rank
      const [analysisRes, rankRes] = await Promise.all([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: addr }),
        }),
        fetch(`/api/leaderboard?address=${addr}`)
      ]);

      const data = await analysisRes.json();
      const rankData = await rankRes.json();
      
      setResult(data);
      setUserRank(rankData.userRank);
      saveHistory(addr, data.score);
      setHistory(loadHistory(addr));
    } catch {}
    finally { setLoading(false); }
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
      `🔐 My Arc Testnet wallet trust score: ${result.score}/100 — ${result.trustLevel}\n\nCheck yours on ArcTrust 👇`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const color = result ? getScoreColor(result.score) : '#4a9aba';
  const badge = result ? getBadge(result.score) : null;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-10 animate-fade-in">
          <div className="section-tag mx-auto">👤 My Score</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            Your Reputation
          </h1>
          <p className="text-white/60">Connect your MetaMask wallet to see your Arc Testnet trust score.</p>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="glass-card p-12 text-center animate-scale-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
              style={{ background: 'rgba(74,154,186,0.15)', border: '1px solid rgba(74,154,186,0.3)' }}>
              🦊
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Connect MetaMask</h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              Connect your wallet to analyze your on-chain reputation and see your trust score.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary text-lg px-10 py-4 mx-auto flex items-center gap-3"
              id="my-score-connect-btn"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connecting…
                </>
              ) : (
                <>🔗 Connect MetaMask</>
              )}
            </button>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/30 text-sm mb-2">Don&apos;t have MetaMask?</p>
              <a
                href="https://metamask.io/download"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-light hover:text-white transition-colors text-sm"
              >
                Download MetaMask →
              </a>
            </div>
          </div>
        )}

        {/* Wrong network */}
        {isConnected && !isCorrectNetwork && (
          <div className="glass-card p-10 text-center animate-scale-in">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-3">Wrong Network</h2>
            <p className="text-white/60 mb-6">
              Please switch to <strong className="text-teal-light">Arc Testnet</strong> to see your score.
            </p>
            <button onClick={switchNetwork} className="btn-primary">
              Switch to Arc Testnet
            </button>
          </div>
        )}

        {/* Loading */}
        {isConnected && isCorrectNetwork && loading && (
          <div className="flex flex-col items-center py-24 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"/>
              <div className="absolute inset-0 rounded-full border-4 border-t-teal-light animate-spin"/>
            </div>
            <p className="text-white/60">Analyzing your wallet…</p>
          </div>
        )}

        {/* Score result */}
        {isConnected && isCorrectNetwork && result && !loading && (
          <div className="space-y-6 animate-scale-in">

            {/* Main card */}
            <div className="glass-card p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                <span className="font-mono text-white/50 text-sm">{shortenAddress(address!)}</span>
                {badge && <span className={`badge ${badge.cls}`}>{badge.emoji} {badge.label}</span>}
                {userRank && (
                  <span className="flex items-center gap-1 text-teal-light text-sm font-bold">
                    🏅 Ranked #{userRank}
                  </span>
                )}
              </div>
              <div className="flex justify-center mb-6">
                <ScoreRing score={result.score} size={220} />
              </div>

              {/* Verdict */}
              <div
                className="rounded-xl p-5 mb-6 text-left"
                style={{ background: `${color}11`, border: `1px solid ${color}22` }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color }}>
                  🤖 AI Verdict
                </p>
                <p className="text-white/80 italic leading-relaxed">&ldquo;{result.verdict}&rdquo;</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={shareOnX} className="btn-primary flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
                <button
                  onClick={() => router.push(`/score/${address}`)}
                  className="btn-secondary"
                >
                  Full Dashboard →
                </button>
                <button onClick={() => analyze(address!)} className="btn-secondary">
                  ↺ Refresh
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📨', label: 'Total Txns', value: result.walletData.txCount.toLocaleString() },
                { icon: '📅', label: 'Wallet Age', value: `${result.walletData.walletAgeInDays}d` },
                { icon: '💰', label: 'Volume', value: `${result.walletData.totalValueTransferred} USDC` },
                { icon: '❌', label: 'Failed', value: result.walletData.failedTxCount },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-white/40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Score history */}
            {history.length > 1 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">📈 Score History</h3>
                <div className="space-y-3">
                  {history.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm">{h.date}</span>
                      <span
                        className="font-bold text-lg"
                        style={{ color: getScoreColor(h.score) }}
                      >
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
