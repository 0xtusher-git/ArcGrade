'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { GradientButton } from '@/components/ui/gradient-button';
import SlidingTestimonial from '@/components/ui/sliding-testimonial';
import { Gauge, ArrowsLeftRight, SealCheck, Code } from '@phosphor-icons/react';

const features = [
  {
    id: 'score',
    title: 'Score',
    desc: 'Full trust grade from transaction count, age, and reliability.',
    icon: <Gauge size={20} weight="duotone" />,
  },
  {
    id: 'compare',
    title: 'Compare',
    desc: 'Two wallets, side by side.',
    icon: <ArrowsLeftRight size={20} weight="duotone" />,
  },
  {
    id: 'badge',
    title: 'Badge',
    desc: 'Publish a grade on-chain.',
    icon: <SealCheck size={20} weight="duotone" />,
  },
  {
    id: 'api',
    title: 'API',
    desc: 'Let any Arc app read a score.',
    icon: <Code size={20} weight="duotone" />,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = value.trim();
    if (!addr) return;
    router.push(`/score/${addr.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[17px] font-bold tracking-tight text-white">
            Grade Console
          </Link>

          <div>
            <GradientButton asChild className="min-w-0 px-4 py-2 text-sm font-semibold">
              <Link href="/arcgrade">Launch App</Link>
            </GradientButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:grid-cols-2 lg:gap-16">
          {/* Left */}
          <div>
            <BackgroundPaths title="Wallet reputation on Arc" />

            <p className="relative z-10 mt-5 max-w-lg text-lg leading-relaxed text-neutral-400">
              Paste any address. Get a trust grade from on-chain history before you pay it.
            </p>

            <div className="relative z-10 mt-8 flex items-center gap-7 text-neutral-500">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                  <path d="M4 18 A8 8 0 0 1 20 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="18" r="1.8" fill="currentColor" />
                </svg>
                <span className="text-sm font-semibold tracking-tight text-neutral-300">Arc</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="text-sm font-semibold tracking-tight text-neutral-300">Circle</span>
              </span>
            </div>
          </div>

          {/* Right: live grade card */}
          <div
            id="grade"
            className="relative z-10 scroll-mt-24 rounded-3xl border border-white/10 bg-neutral-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Trust grade</span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Arc mainnet
              </span>
            </div>

            <div className="mt-6 flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
                </svg>
                <div className="relative flex flex-col items-center">
                  <span className="font-mono text-3xl font-bold leading-none text-neutral-600">—</span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">/ 100</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Awaiting address</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                  Tx count, wallet age, consistency, value, and reliability.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0x..."
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Arc wallet address"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-white/30"
              />
              <GradientButton type="submit" className="shrink-0">
                Check
              </GradientButton>
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <SlidingTestimonial />

      {/* Features */}
      <section className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need on Arc
          </h2>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.id}
                id={f.id}
                className="scroll-mt-24 rounded-2xl border border-white/10 bg-neutral-900/50 p-6 transition-colors hover:border-white/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                  {f.icon}
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6">
          <span className="font-semibold tracking-tight text-white">Grade Console</span>
          <span className="flex items-center gap-2 text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Arc mainnet
          </span>
          <a
            href="https://explorer.arc.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            explorer.arc.io
          </a>
        </div>
      </footer>
    </div>
  );
}
