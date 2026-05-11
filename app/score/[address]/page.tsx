'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import SearchBar from '@/components/SearchBar';
import { getScoreColor, getTrustLevel, getBadge, shortenAddress } from '@/lib/scoring';

interface AnalysisResult {
  address: string;
  score: number;
  breakdown: {
    txScore: number;
    ageScore: number;
    consistencyScore: number;
    avgValueScore: number;
    reliabilityScore: number;
    total: number;
  };
  trustLevel: string;
  verdict: string;
  walletData: {
    txCount: number;
    failedTxCount: number;
    walletAgeInDays: number;
    avgTxValue: number;
    totalValueTransferred: string;
    isReal: boolean;
    transactions?: any[];
  };
}

export default function ScorePage() {
  const params = useParams();
  const router = useRouter();
  const address = (params?.address as string) ?? '';

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const analyze = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { analyze(); }, [analyze]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    if (!result) return;
    const text = encodeURIComponent(
      `🔐 My Arc Testnet wallet trust score: ${result.score}/100 — ${result.trustLevel}\n\nCheck yours at ArcGrade 👇`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const downloadCertificate = () => {
    if (!result) return;
    const color = getScoreColor(result.score);
    const badge = getBadge(result.score);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#07111e"/>
          <stop offset="50%" style="stop-color:#1a3a5c"/>
          <stop offset="100%" style="stop-color:#2d7a9a"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#4a9aba"/>
          <stop offset="100%" style="stop-color:#f5e6c8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#bg)" rx="20"/>
      <rect x="2" y="2" width="796" height="446" fill="none" stroke="url(#accent)" stroke-width="2" rx="20" opacity="0.5"/>
      <text x="40" y="60" font-family="Inter,sans-serif" font-size="28" font-weight="900" fill="white">Arc<tspan fill="${color}">Grade</tspan></text>
      <text x="40" y="95" font-family="Inter,sans-serif" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="3">TRUST CERTIFICATE</text>
      <text x="40" y="200" font-family="Inter,sans-serif" font-size="100" font-weight="900" fill="${color}">${result.score}</text>
      <text x="155" y="200" font-family="Inter,sans-serif" font-size="30" fill="rgba(255,255,255,0.4)">/100</text>
      <text x="40" y="235" font-family="Inter,sans-serif" font-size="18" fill="${color}" font-weight="600">${badge.emoji} ${result.trustLevel}</text>
      <text x="40" y="300" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.5)">${address}</text>
      <text x="40" y="340" font-family="Inter,sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">${result.walletData.txCount} transactions · ${result.walletData.walletAgeInDays} days old</text>
      <text x="40" y="410" font-family="Inter,sans-serif" font-size="12" fill="rgba(255,255,255,0.25)">Verified by ArcGrade · ${new Date().toLocaleDateString()} · testnet.arcscan.app</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arcgrade-${address.slice(0, 10)}.svg`;
    a.click();
  };

  const color = result ? getScoreColor(result.score) : '#4a9aba';
  const badge = result ? getBadge(result.score) : null;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <Navbar />
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb + back */}
        <div className="flex items-center gap-2 mb-8 text-white/40 text-sm animate-fade-in">
          <button onClick={() => router.push('/')} className="hover:text-white transition-colors flex items-center gap-1">
            ← Home
          </button>
          <span>/</span>
          <span className="font-mono text-white/60">{shortenAddress(address)}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"/>
              <div className="absolute inset-0 rounded-full border-4 border-t-teal-light animate-spin"/>
            </div>
            <div className="text-white/60 text-lg">Analyzing on-chain activity…</div>
            <div className="text-white/30 text-sm max-w-sm text-center">
              Fetching transactions from Arc Testnet and computing trust score
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-red-400 text-lg mb-6">{error}</div>
            <button onClick={analyze} className="btn-primary">Try Again</button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6 animate-scale-in">

            {/* Header card */}
            <div className="glass-card p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

                {/* Score ring */}
                <div className="flex-shrink-0">
                  <ScoreRing score={result.score} size={200} />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  {/* Address */}
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-3 flex-wrap">
                    <span className="font-mono text-white/60 text-sm break-all">{address}</span>
                    <button
                      onClick={copyAddress}
                      className="text-teal-light hover:text-white transition-colors text-xs"
                      aria-label="Copy address"
                    >
                      {copied ? '✓ Copied' : '⎘ Copy'}
                    </button>
                    <a
                      href={`https://testnet.arcscan.app/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-light hover:text-white transition-colors text-xs"
                    >
                      ↗ Explorer
                    </a>
                  </div>

                  {/* Badge + trust */}
                  {badge && (
                    <div className="flex items-center gap-3 justify-center md:justify-start mb-4 flex-wrap">
                      <span className={`badge ${badge.cls} text-sm px-4 py-1.5`}>
                        {badge.emoji} {badge.label}
                      </span>
                      <span className="text-white/50 text-sm">{result.trustLevel}</span>
                      {!result.walletData.isReal && (
                        <span className="badge badge-new text-xs">Demo Data</span>
                      )}
                    </div>
                  )}

                  {/* AI Verdict */}
                  <div
                    className="rounded-xl p-5 mb-6 text-white/80 leading-relaxed italic"
                    style={{ background: `${color}11`, border: `1px solid ${color}22` }}
                  >
                    <span className="text-xs font-semibold not-italic uppercase tracking-wider" style={{ color }}>
                      🤖 AI Verdict
                    </span>
                    <p className="mt-2">&ldquo;{result.verdict}&rdquo;</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button onClick={shareOnX} className="btn-secondary text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share on X
                    </button>
                    <button onClick={downloadCertificate} className="btn-secondary text-sm flex items-center gap-2">
                      ⬇ Download Certificate
                    </button>
                    <button onClick={analyze} className="btn-secondary text-sm flex items-center gap-2">
                      ↺ Re-analyze
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="glass-card p-8">
              <h2 className="text-xl font-bold text-white mb-6">📊 Score Breakdown</h2>
              <div className="space-y-5">
                {[
                  { label: 'Transaction History', value: result.breakdown.txScore, max: 25, desc: `${result.walletData.txCount} total transactions`, color: '#4a9aba' },
                  { label: 'Wallet Age',           value: result.breakdown.ageScore, max: 20, desc: `${result.walletData.walletAgeInDays} days old`, color: '#00e5a0' },
                  { label: 'Consistency',          value: result.breakdown.consistencyScore, max: 20, desc: 'Activity spread over time', color: '#a29bfe' },
                  { label: 'Avg Transaction Value',value: result.breakdown.avgValueScore, max: 20, desc: `${result.walletData.avgTxValue.toFixed(4)} USDC avg`, color: '#ffd700' },
                  { label: 'Reliability',          value: result.breakdown.reliabilityScore, max: 15, desc: `${result.walletData.failedTxCount} failed txns`, color: '#fd79a8' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-sm font-mono" style={{ color: item.color }}>
                        {item.value}/{item.max}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(item.value / item.max) * 100}%`,
                          background: `linear-gradient(90deg, ${item.color}77, ${item.color})`,
                          boxShadow: `0 0 8px ${item.color}44`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-white/40 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📨', label: 'Total Txns',     value: result.walletData.txCount.toLocaleString() },
                { icon: '❌', label: 'Failed Txns',    value: result.walletData.failedTxCount },
                { icon: '📅', label: 'Wallet Age',     value: `${result.walletData.walletAgeInDays}d` },
                { icon: '💰', label: 'Total Volume',   value: `${result.walletData.totalValueTransferred} USDC` },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-white/40 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Transaction History */}
            {result.walletData.transactions && result.walletData.transactions.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-bold text-white mb-6">📜 Recent Activity</h2>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 px-2 py-2 border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-white/40">
                    <div className="col-span-4">Tx Hash</div>
                    <div className="col-span-4">Method</div>
                    <div className="col-span-4 text-right">Value (USDC)</div>
                  </div>
                  {result.walletData.transactions.map((tx, i) => (
                    <div key={tx.hash} className="grid grid-cols-12 gap-4 px-2 py-3 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                      <div className="col-span-4 font-mono text-xs text-white/60">
                        {shortenAddress(tx.hash)}
                      </div>
                      <div className="col-span-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.from.toLowerCase() === address.toLowerCase() ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                          {tx.from.toLowerCase() === address.toLowerCase() ? '📤 Outgoing' : '📥 Incoming'}
                        </span>
                      </div>
                      <div className="col-span-4 text-right font-mono text-sm text-white">
                        {(parseFloat(tx.value) / 1e18).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a
                    href={`https://testnet.arcscan.app/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-light hover:text-white transition-colors"
                  >
                    View all transactions on Explorer →
                  </a>
                </div>
              </div>
            )}

            {/* Search another */}
            <div className="glass-card p-6 flex flex-col items-center gap-4">
              <p className="text-white/50 text-sm">Check another wallet</p>
              <SearchBar size="md" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
