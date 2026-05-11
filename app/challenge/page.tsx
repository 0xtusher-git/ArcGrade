'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ScoreRing from '@/components/ScoreRing';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, getBadge, getScoreColor } from '@/lib/scoring';
import { ethers } from 'ethers';

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

  // Auto-fill addr1 if connected
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

  return (
    <div className="min-h-screen pt-28 pb-16 px-4 dot-grid">
      <Navbar />
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-12 animate-fade-in">
          <div className="section-tag mx-auto">⚔️ Challenge</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Wallet Battle</h1>
          <p className="text-white/60">Compare trust scores side-by-side to see who wins.</p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center animate-scale-in max-w-xl mx-auto">
            <div className="text-5xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-3">Feature Locked</h2>
            <p className="text-white/50 mb-8">
              The Wallet Battle feature is exclusive to connected users. 
              Connect your wallet to challenge others and compare reputations.
            </p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary text-lg px-10 py-4 mx-auto flex items-center gap-3"
            >
              {isConnecting ? 'Connecting...' : '🔗 Connect Wallet to Unlock'}
            </button>
          </div>
        ) : (
          <>
            {/* Search / Input Area */}
            <div className="glass-card p-6 mb-12 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase ml-2">Wallet #1</label>
                  <input 
                    value={addr1} 
                    onChange={e => setAddr1(e.target.value)}
                    placeholder="Paste address 1..."
                    className="input-glass"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 uppercase ml-2">Wallet #2</label>
                  <input 
                    value={addr2} 
                    onChange={e => setAddr2(e.target.value)}
                    placeholder="Paste address 2..."
                    className="input-glass"
                  />
                </div>
              </div>
              <button 
                onClick={handleChallenge}
                disabled={(res1?.loading || res2?.loading)}
                className="btn-primary w-full text-lg flex items-center justify-center gap-2"
              >
                { (res1?.loading || res2?.loading) ? 'Analyzing...' : '⚡ Start Battle' }
              </button>
            </div>

            {/* Results Area */}
            {(res1 || res2) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
                
                {/* VS Badge */}
                {res1 && res2 && !res1.loading && !res2.loading && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:block">
                    <div className="w-16 h-16 rounded-full bg-navy-deeper border-4 border-teal flex items-center justify-center text-2xl font-black italic text-white shadow-2xl">
                      VS
                    </div>
                  </div>
                )}

                {/* Wallet 1 */}
                <div className={`glass-card p-8 text-center transition-all duration-500 ${winner === 1 ? 'scale-105 border-teal-light shadow-[0_0_50px_rgba(107,184,212,0.2)]' : winner === 2 ? 'opacity-60 grayscale' : ''}`}>
                  {res1?.loading ? (
                    <div className="py-20 animate-pulse text-white/40">Analyzing...</div>
                  ) : res1?.error ? (
                    <div className="py-20 text-red-400">Error: {res1.error}</div>
                  ) : res1 ? (
                    <>
                      <div className="mb-4">
                        <span className={`badge ${res1.badge.cls} mb-2`}>{res1.badge.emoji} {res1.badge.label}</span>
                        <h3 className="font-mono text-white/60 text-sm">{shortenAddress(res1.address)}</h3>
                      </div>
                      <div className="flex justify-center mb-6">
                        <ScoreRing score={res1.score} size={180} />
                      </div>
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Transactions</span>
                          <span className="text-white font-bold">{res1.txCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Wallet Age</span>
                          <span className="text-white font-bold">{res1.age}d</span>
                        </div>
                      </div>
                      {winner === 1 && (
                        <div className="mt-8 py-2 bg-teal/20 border border-teal/40 rounded-lg text-teal-light font-black uppercase tracking-widest animate-bounce">
                          🏆 WINNER
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-20 text-white/20">Waiting for address 1...</div>
                  )}
                </div>

                {/* Wallet 2 */}
                <div className={`glass-card p-8 text-center transition-all duration-500 ${winner === 2 ? 'scale-105 border-teal-light shadow-[0_0_50px_rgba(107,184,212,0.2)]' : winner === 1 ? 'opacity-60 grayscale' : ''}`}>
                  {res2?.loading ? (
                    <div className="py-20 animate-pulse text-white/40">Analyzing...</div>
                  ) : res2?.error ? (
                    <div className="py-20 text-red-400">Error: {res2.error}</div>
                  ) : res2 ? (
                    <>
                      <div className="mb-4">
                        <span className={`badge ${res2.badge.cls} mb-2`}>{res2.badge.emoji} {res2.badge.label}</span>
                        <h3 className="font-mono text-white/60 text-sm">{shortenAddress(res2.address)}</h3>
                      </div>
                      <div className="flex justify-center mb-6">
                        <ScoreRing score={res2.score} size={180} />
                      </div>
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Transactions</span>
                          <span className="text-white font-bold">{res2.txCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/40">Wallet Age</span>
                          <span className="text-white font-bold">{res2.age}d</span>
                        </div>
                      </div>
                      {winner === 2 && (
                        <div className="mt-8 py-2 bg-teal/20 border border-teal/40 rounded-lg text-teal-light font-black uppercase tracking-widest animate-bounce">
                          🏆 WINNER
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-20 text-white/20">Waiting for address 2...</div>
                  )}
                </div>
              </div>
            )}

            {/* Battle Summary */}
            {winner !== null && res1 && res2 && !res1.loading && !res2.loading && (
              <div className="mt-12 glass-card p-8 text-center animate-fade-in-up">
                <h2 className="text-2xl font-black text-white mb-2">Battle Verdict</h2>
                <p className="text-white/60 mb-6">
                  {winner === 0 
                    ? "It's a perfect draw! Both wallets share the same reputation." 
                    : `${winner === 1 ? 'Wallet #1' : 'Wallet #2'} takes the lead by ${scoreDiff} points.`
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => { setAddr1(''); setAddr2(''); setRes1(null); setRes2(null); }}
                    className="btn-secondary"
                  >
                    Reset Battle
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
