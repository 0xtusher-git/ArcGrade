'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import SearchBar from '@/components/SearchBar';
import { getScoreColor, getTrustLevel, getBadge, shortenAddress } from '@/lib/scoring';
import {
  ArrowLeft, Warning, Copy, Check, ArrowSquareOut, Brain, ChartBar,
  ClockCounterClockwise, ArrowsLeftRight, XCircle, CalendarBlank, Coins,
  ArrowUpRight, ArrowDownLeft, DownloadSimple, ArrowClockwise,
} from '@phosphor-icons/react';

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
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 20000);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        signal: controller.signal,
      });
      clearTimeout(t);
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
      `🔐 My Arc wallet trust score: ${result.score}/100 — ${result.trustLevel}\n\nCheck yours at ArcGrade 👇`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const downloadCertificate = () => {
    if (!result) return;
    const color = getScoreColor(result.score);
    const badge = getBadge(result.score);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <rect width="800" height="450" fill="#060b16" rx="16"/>
      <rect x="1.5" y="1.5" width="797" height="447" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1.5" rx="16"/>
      <text x="40" y="60" font-family="Plus Jakarta Sans,sans-serif" font-size="28" font-weight="700" fill="#ffffff">Arc<tspan fill="#64748b">Grade</tspan></text>
      <text x="40" y="95" font-family="Plus Jakarta Sans,sans-serif" font-size="11" fill="rgba(255,255,255,0.4)" letter-spacing="3">TRUST CERTIFICATE</text>
      <text x="40" y="200" font-family="monospace" font-size="100" font-weight="700" fill="${color}">${result.score}</text>
      <text x="155" y="200" font-family="monospace" font-size="30" fill="rgba(255,255,255,0.4)">/100</text>
      <text x="40" y="235" font-family="Plus Jakarta Sans,sans-serif" font-size="18" fill="${color}" font-weight="600">${badge.label} · ${result.trustLevel}</text>
      <text x="40" y="300" font-family="monospace" font-size="14" fill="rgba(255,255,255,0.5)">${address}</text>
      <text x="40" y="340" font-family="Plus Jakarta Sans,sans-serif" font-size="13" fill="rgba(255,255,255,0.4)">${result.walletData.txCount} transactions · ${result.walletData.walletAgeInDays} days old</text>
      <text x="40" y="410" font-family="Plus Jakarta Sans,sans-serif" font-size="12" fill="rgba(255,255,255,0.25)">Verified by ArcGrade · ${new Date().toLocaleDateString()} · abscan.org</text>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arcgrade-${address.slice(0, 10)}.svg`;
    a.click();
  };

  const badge = result ? getBadge(result.score) : null;

  const breakdown = result
    ? [
        { label: 'Transaction history', value: result.breakdown.txScore, max: 25, desc: `${result.walletData.txCount} total transactions` },
        { label: 'Wallet age', value: result.breakdown.ageScore, max: 20, desc: `${result.walletData.walletAgeInDays} days old` },
        { label: 'Consistency', value: result.breakdown.consistencyScore, max: 20, desc: 'Activity spread over time' },
        { label: 'Avg transaction value', value: result.breakdown.avgValueScore, max: 20, desc: `${result.walletData.avgTxValue.toFixed(4)} USDC avg` },
        { label: 'Reliability', value: result.breakdown.reliabilityScore, max: 15, desc: `${result.walletData.failedTxCount} failed txns` },
      ]
    : [];

  return (
    <div className="min-h-screen px-4 pb-16 pt-32">
      <Navbar />
      <div className="mx-auto max-w-5xl">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-slate-500 animate-fade-in">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 transition-colors hover:text-white">
            <ArrowLeft size={15} weight="bold" /> Home
          </button>
          <span className="text-slate-700">/</span>
          <span className="font-mono text-slate-400">{shortenAddress(address)}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-6 py-32">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-4 border-white/10" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-teal" />
            </div>
            <div className="text-lg text-slate-300">Analyzing on-chain activity…</div>
            <div className="max-w-sm text-center text-sm text-slate-600">
              Fetching transactions from Arc and computing trust score
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-card p-12 text-center">
            <div className="mb-4 flex justify-center"><Warning size={30} weight="duotone" className="text-red-400" /></div>
            <div className="mb-6 text-lg text-red-400">{error}</div>
            <button onClick={analyze} className="btn-primary mx-auto flex">Try Again</button>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6 animate-scale-in">

            {/* Header card */}
            <div className="glass-card p-8 md:p-10">
              <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                <div className="flex-shrink-0">
                  <ScoreRing score={result.score} size={200} />
                </div>

                <div className="flex-1 text-center md:text-left">
                  {/* Address */}
                  <div className="mb-3 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    <span className="break-all font-mono text-sm text-slate-400">{address}</span>
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-white"
                      aria-label="Copy address"
                    >
                      {copied ? <><Check size={13} weight="bold" /> Copied</> : <><Copy size={13} weight="bold" /> Copy</>}
                    </button>
                    <a
                      href={`https://abscan.org/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-teal transition-colors hover:text-teal-light"
                    >
                      <ArrowSquareOut size={13} weight="bold" /> Explorer
                    </a>
                  </div>

                  {/* Badge */}
                  {badge && (
                    <div className="mb-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                      <span className={`badge ${badge.cls} px-3 py-1 text-sm`}>{badge.label}</span>
                      <span className="text-sm text-slate-500">{result.trustLevel}</span>
                      {!result.walletData.isReal && <span className="badge badge-trusted text-xs">Demo data</span>}
                    </div>
                  )}

                  {/* Verdict */}
                  <div className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <Brain size={15} weight="duotone" /> AI Verdict
                    </span>
                    <p className="mt-2 leading-relaxed text-slate-300">&ldquo;{result.verdict}&rdquo;</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                    <button onClick={shareOnX} className="btn-primary text-sm">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Share on X
                    </button>
                    <button onClick={downloadCertificate} className="btn-secondary text-sm">
                      <DownloadSimple size={16} weight="bold" /> Certificate
                    </button>
                    <button onClick={analyze} className="btn-secondary text-sm">
                      <ArrowClockwise size={16} weight="bold" /> Re-analyze
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown — quiet list */}
            <div className="glass-card p-8">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <ChartBar size={15} weight="duotone" /> Score Breakdown
              </h2>
              <div>
                {breakdown.map((item) => {
                  const pct = Math.round((item.value / item.max) * 100);
                  return (
                    <div key={item.label} className="border-b border-white/[0.05] py-4 last:border-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-slate-200">{item.label}</span>
                        <span className="font-mono text-sm tabular-nums text-slate-400">
                          {item.value}<span className="text-slate-600">/{item.max}</span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-teal/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-600">{item.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wallet stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: <ArrowsLeftRight size={20} weight="duotone" />, label: 'Total txns', value: result.walletData.txCount.toLocaleString() },
                { icon: <XCircle size={20} weight="duotone" />, label: 'Failed txns', value: result.walletData.failedTxCount },
                { icon: <CalendarBlank size={20} weight="duotone" />, label: 'Wallet age', value: `${result.walletData.walletAgeInDays}d` },
                { icon: <Coins size={20} weight="duotone" />, label: 'Total volume', value: `${result.walletData.totalValueTransferred} USDC` },
              ].map((s) => (
                <div key={s.label} className="glass-card p-5 text-center">
                  <div className="mb-2.5 flex justify-center text-teal">{s.icon}</div>
                  <div className="break-all font-mono text-lg font-bold tabular-nums text-slate-100">{s.value}</div>
                  <div className="mt-1 text-xs text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            {result.walletData.transactions && result.walletData.transactions.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <ClockCounterClockwise size={15} weight="duotone" /> Recent Activity
                </h2>
                <div className="overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 border-b border-white/[0.08] px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-4">Tx hash</div>
                    <div className="col-span-4">Direction</div>
                    <div className="col-span-4 text-right">Value (USDC)</div>
                  </div>
                  {result.walletData.transactions.map((tx) => (
                    <div key={tx.hash} className="grid grid-cols-12 items-center gap-4 border-b border-white/[0.04] px-2 py-3 transition-colors hover:bg-white/[0.02]">
                      <div className="col-span-4 font-mono text-xs text-slate-500">{shortenAddress(tx.hash)}</div>
                      <div className="col-span-4">
                        <span className="inline-flex items-center gap-1 rounded border border-white/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {tx.from.toLowerCase() === address.toLowerCase()
                            ? <><ArrowUpRight size={12} weight="bold" /> Out</>
                            : <><ArrowDownLeft size={12} weight="bold" /> In</>}
                        </span>
                      </div>
                      <div className="col-span-4 text-right font-mono text-sm tabular-nums text-slate-200">
                        {(parseFloat(tx.value) / 1e18).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <a
                    href={`https://abscan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-white"
                  >
                    View all transactions on Explorer <ArrowSquareOut size={12} weight="bold" />
                  </a>
                </div>
              </div>
            )}

            {/* Search another */}
            <div className="glass-card flex flex-col items-center gap-4 p-6">
              <p className="text-sm text-slate-500">Check another wallet</p>
              <SearchBar size="md" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
