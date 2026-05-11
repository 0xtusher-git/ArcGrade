import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import StatCard from '@/components/StatCard';

export default function HomePage() {
  return (
    <div className="min-h-screen dot-grid">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">

        {/* Tag */}
        <div className="section-tag animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-teal-light animate-pulse" />
          Built on Arc Testnet · Powered by AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 animate-fade-in-up delay-100"
          style={{ letterSpacing: '-0.03em' }}>
          Your Wallet&apos;s{' '}
          <span style={{
            background: 'linear-gradient(135deg, #4a9aba, #f5e6c8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Reputation
          </span>
          <br />— On-Chain, Forever
        </h1>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-white/60 max-w-2xl leading-relaxed mb-12 animate-fade-in-up delay-200">
          AI scores every Arc wallet. <span className="text-white/80">No middleman.</span>{' '}
          <span className="text-white/80">No bias.</span> Just truth from the chain.
        </p>

        {/* Search bar */}
        <div className="animate-fade-in-up delay-300 w-full flex justify-center mb-6">
          <SearchBar size="lg" />
        </div>
        <p className="text-white/30 text-sm animate-fade-in delay-400">
          Paste any 0x address · Free to look up · Score stored on-chain
        </p>

        {/* Floating score previews */}
        <div className="absolute left-8 top-1/3 hidden xl:block animate-float opacity-40">
          <div className="glass-card px-5 py-4 text-center">
            <div className="text-3xl font-black" style={{ color: '#00e5a0' }}>87</div>
            <div className="text-xs text-white/50 mt-1">0x3f4a…9c2d</div>
          </div>
        </div>
        <div className="absolute right-8 top-2/5 hidden xl:block animate-float opacity-40" style={{ animationDelay: '2s' }}>
          <div className="glass-card px-5 py-4 text-center">
            <div className="text-3xl font-black" style={{ color: '#ffd700' }}>54</div>
            <div className="text-xs text-white/50 mt-1">0x7b1c…4a8f</div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-xs text-white/50">Scroll to explore</span>
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Live Stats */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-tag mx-auto">📊 Live Network Stats</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Arc Testnet at a Glance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon="🏦" value="2,847" label="Wallets Scored" delay={0} color="#4a9aba" />
          <StatCard icon="📈" value="68" label="Average Trust Score" delay={100} color="#00e5a0" />
          <StatCard icon="⛓️" value="142K" label="Transactions Analyzed" delay={200} color="#f5e6c8" />
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-tag mx-auto">🔍 How It Works</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Three steps to trust</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '🔎',
              title: 'Search Any Wallet',
              desc: 'Paste any Arc Testnet wallet address. Our system fetches all on-chain transactions from the blockchain explorer instantly.',
              color: '#4a9aba',
            },
            {
              step: '02',
              icon: '🤖',
              title: 'AI Analyzes Activity',
              desc: 'Claude AI examines transaction history, consistency, volume, wallet age, and failure rate to generate a holistic trust score.',
              color: '#00e5a0',
            },
            {
              step: '03',
              icon: '🏆',
              title: 'Score Stored On-Chain',
              desc: 'The final score (0-100) is stored in a smart contract on Arc Testnet — forever readable by any dApp, protocol, or user.',
              color: '#f5e6c8',
            },
          ].map((item, i) => (
            <div
              key={item.step}
              className="glass-card-hover p-8 relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${i * 150}ms`, animationFillMode: 'both' }}
            >
              {/* Step number watermark */}
              <div
                className="absolute top-4 right-6 text-6xl font-black opacity-10 select-none"
                style={{ color: item.color }}
              >
                {item.step}
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6"
                style={{ background: `${item.color}22`, border: `1px solid ${item.color}33` }}
              >
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring Formula */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="glass-card p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="section-tag mx-auto">🧮 Scoring Formula</div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Transparent by design</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Transaction Count', max: 25, color: '#4a9aba', desc: 'More transactions = higher score' },
              { label: 'Wallet Age',         max: 20, color: '#00e5a0', desc: 'Older wallet = more established' },
              { label: 'Consistency',        max: 20, color: '#a29bfe', desc: 'Regular activity = reliable' },
              { label: 'Avg Transaction Value', max: 20, color: '#ffd700', desc: 'Higher value = more at stake' },
              { label: 'Reliability',        max: 15, color: '#fd79a8', desc: 'Less failures = more reliable' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <span className="text-sm font-mono" style={{ color: item.color }}>+{item.max} pts</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(item.max / 100) * 100}%`,
                        background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-white/40 mt-1">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
            <span className="text-white/60 font-medium">Total possible score</span>
            <span className="text-2xl font-black text-white">100 pts</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto glass-card p-12">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-3xl font-black text-white mb-4">Check your score now</h2>
          <p className="text-white/60 mb-8">Free to look up. Takes 5 seconds. Stored forever.</p>
          <div className="flex justify-center">
            <SearchBar size="md" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <svg viewBox="0 0 36 36" className="w-6 h-6" fill="none">
            <path d="M6 28 Q6 8 18 8 Q30 8 30 28" stroke="#4a9aba" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <circle cx="18" cy="28" r="3" fill="#4a9aba"/>
          </svg>
          <span className="font-bold text-white">Arc<span className="text-teal-light">Trust</span></span>
        </div>
        <p className="text-white/40 text-sm">
          Built on{' '}
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
            className="text-teal-light hover:text-white transition-colors">Arc Testnet</a>{' '}
          · Powered by Claude AI · Open Source
        </p>
      </footer>
    </div>
  );
}
