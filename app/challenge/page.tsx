'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, getBadge } from '@/lib/scoring';
import { ethers } from 'ethers';
import { Sword, Lock, Link, Lightning, Trophy } from '@phosphor-icons/react';

interface CompareResult {
  address: string;
  score: number;
  badge: any;
  txCount: number;
  age: number;
  loading: boolean;
  error: string;
}

export default function ChallengePage() {
  const { address: connectedAddress, isConnected, connect, isConnecting } = useWallet();
  const [addr1, setAddr1] = useState('');
  const [addr2, setAddr2] = useState('');

  const [res1, setRes1] = useState<CompareResult | null>(null);
  const [res2, setRes2] = useState<CompareResult | null>(null);

  useEffect(() => {
    if (connectedAddress && !addr1) {
      setAddr1(connectedAddress);
      fetchData(connectedAddress, setRes1);
    }
  }, [connectedAddress]);

  const fetchData = async (address: string, setter: (val: CompareResult) => void) => {
    if (!ethers.isAddress(address)) return;
    setter({ address, score: 0, badge: null, txCount: 0, age: 0, loading: true, error: '' });
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setter({
        address,
        score: data.score,
        badge: getBadge(data.score),
        txCount: data.walletData.txCount,
        age: data.walletData.walletAgeInDays,
        loading: false,
        error: '',
      });
    } catch (e: any) {
      setter({ address, score: 0, badge: null, txCount: 0, age: 0, loading: false, error: e.message || 'Failed' });
    }
  };

  const handleChallenge = () => {
    if (addr1) fetchData(addr1, setRes1);
    if (addr2) fetchData(addr2, setRes2);
  };

  const winner = res1 && res2 && !res1.loading && !res2.loading && !res1.error && !res2.error
    ? (res1.score > res2.score ? 1 : res2.score > res1.score ? 2 : 0)
    : null;

  const scoreDiff = res1 && res2 ? Math.abs(res1.score - res2.score) : 0;

  const WinnerBadge = () => (
    <div className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.05] py-2 text-xs font-semibold uppercase tracking-widest text-slate-100">
      <Trophy size={15} weight="duotone" className="text-amber-400" /> Winner
    </div>
  );

  return (
    <div className="min-h-screen px-4 pb-16 pt-32">
      <Navbar />
      <div className="mx-auto max-w-5xl">

        <div className="mb-12 text-center animate-fade-in">
          <div className="section-tag mx-auto"><Sword size={13} weight="duotone" /> Challenge</div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">Wallet Battle</h1>
          <p className="text-slate-500">Compare trust scores side-by-side to see who wins.</p>
        </div>

        {!isConnected ? (
          <div className="glass-card mx-auto max-w-xl p-12 text-center animate-scale-in">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-teal/10 text-teal">
              <Lock size={26} weight="duotone" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Feature Locked</h2>
            <p className="mb-8 text-slate-500">
              The Wallet Battle feature is exclusive to connected users.
              Connect your wallet to challenge others and compare reputations.
            </p>
            <button onClick={connect} disabled={isConnecting} className="btn-primary mx-auto flex text-base">
              {isConnecting ? 'Connecting…' : (<><Link size={16} weight="bold" /> Connect to Unlock</>)}
            </button>
          </div>
        ) : (
          <>
            {/* Input */}
            <div className="glass-card mb-12 p-6 animate-scale-in">
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet #1</label>
                  <input value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="Paste address 1…" className="input-glass" />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet #2</label>
                  <input value={addr2} onChange={(e) => setAddr2(e.target.value)} placeholder="Paste address 2…" className="input-glass" />
                </div>
              </div>
              <button
                onClick={handleChallenge}
                disabled={(res1?.loading || res2?.loading)}
                className="btn-primary flex w-full text-base"
              >
                {(res1?.loading || res2?.loading) ? 'Analyzing…' : (<><Lightning size={16} weight="bold" /> Start Battle</>)}
              </button>
            </div>

            {/* Results */}
            {(res1 || res2) && (
              <div className="relative grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                {res1 && res2 && !res1.loading && !res2.loading && (
                  <div className="absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.12] bg-[#060b16] text-sm font-bold tracking-widest text-slate-300">
                      VS
                    </div>
                  </div>
                )}

                {/* Wallet 1 */}
                <div className={`glass-card p-8 text-center transition-all duration-500 ${winner === 1 ? 'scale-105 border-teal/40' : winner === 2 ? 'opacity-50' : ''}`}>
                  {res1?.loading ? (
                    <div className="py-20 text-slate-500">Analyzing…</div>
                  ) : res1?.error ? (
                    <div className="py-20 text-red-400">Error: {res1.error}</div>
                  ) : res1 ? (
                    <>
                      <div className="mb-4">
                        <span className={`badge ${res1.badge.cls} mb-2`}>{res1.badge.label}</span>
                        <h3 className="font-mono text-sm text-slate-500">{shortenAddress(res1.address)}</h3>
                      </div>
                      <div className="mb-6 flex justify-center">
                        <ScoreRing score={res1.score} size={180} />
                      </div>
                      <div className="space-y-3 border-t border-white/[0.06] pt-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Transactions</span>
                          <span className="font-mono font-bold text-white">{res1.txCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Wallet age</span>
                          <span className="font-mono font-bold text-white">{res1.age}d</span>
                        </div>
                      </div>
                      {winner === 1 && <WinnerBadge />}
                    </>
                  ) : (
                    <div className="py-20 text-slate-700">Waiting for address 1…</div>
                  )}
                </div>

                {/* Wallet 2 */}
                <div className={`glass-card p-8 text-center transition-all duration-500 ${winner === 2 ? 'scale-105 border-teal/40' : winner === 1 ? 'opacity-50' : ''}`}>
                  {res2?.loading ? (
                    <div className="py-20 text-slate-500">Analyzing…</div>
                  ) : res2?.error ? (
                    <div className="py-20 text-red-400">Error: {res2.error}</div>
                  ) : res2 ? (
                    <>
                      <div className="mb-4">
                        <span className={`badge ${res2.badge.cls} mb-2`}>{res2.badge.label}</span>
                        <h3 className="font-mono text-sm text-slate-500">{shortenAddress(res2.address)}</h3>
                      </div>
                      <div className="mb-6 flex justify-center">
                        <ScoreRing score={res2.score} size={180} />
                      </div>
                      <div className="space-y-3 border-t border-white/[0.06] pt-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Transactions</span>
                          <span className="font-mono font-bold text-white">{res2.txCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Wallet age</span>
                          <span className="font-mono font-bold text-white">{res2.age}d</span>
                        </div>
                      </div>
                      {winner === 2 && <WinnerBadge />}
                    </>
                  ) : (
                    <div className="py-20 text-slate-700">Waiting for address 2…</div>
                  )}
                </div>
              </div>
            )}

            {/* Verdict */}
            {winner !== null && res1 && res2 && !res1.loading && !res2.loading && (
              <div className="glass-card mt-12 p-8 text-center animate-fade-in-up">
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">Battle Verdict</h2>
                <p className="mb-6 text-slate-500">
                  {winner === 0
                    ? "It's a perfect draw — both wallets share the same reputation."
                    : `${winner === 1 ? 'Wallet #1' : 'Wallet #2'} takes the lead by ${scoreDiff} points.`}
                </p>
                <button
                  onClick={() => { setAddr1(''); setAddr2(''); setRes1(null); setRes2(null); }}
                  className="btn-secondary mx-auto flex"
                >
                  Reset Battle
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
