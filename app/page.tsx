'use client';

import Link from 'next/link';
import { BackgroundPaths } from '@/components/ui/background-paths';
import { GradientButton } from '@/components/ui/gradient-button';
import SlidingTestimonial from '@/components/ui/sliding-testimonial';
import { ArrowsLeftRight, Gauge, SealCheck, Code } from '@phosphor-icons/react';

const features = [
  {
    id: 'swap',
    title: 'Swap',
    desc: 'Trade USDC, WETH, and EURC through Uniswap v4 on Arc.',
    icon: <ArrowsLeftRight size={20} weight="duotone" />,
  },
  {
    id: 'quote',
    title: 'Live Quotes',
    desc: 'Prices come straight from the on-chain Uniswap V4Quoter.',
    icon: <Gauge size={20} weight="duotone" />,
  },
  {
    id: 'reputation',
    title: 'Reputation',
    desc: 'Check any wallet’s history before you trade with it.',
    icon: <SealCheck size={20} weight="duotone" />,
  },
  {
    id: 'api',
    title: 'API',
    desc: 'Let any Arc app read a wallet score.',
    icon: <Code size={20} weight="duotone" />,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[17px] font-bold tracking-tight text-white">
            RepDex Terminal
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs font-medium text-neutral-400 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Arc mainnet
            </span>
            <GradientButton asChild className="min-w-0 px-4 py-2 text-sm font-semibold">
              <Link href="/app">Launch App</Link>
            </GradientButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <div>
            <BackgroundPaths title="Trade on Arc" />

            <p className="relative z-10 mt-5 max-w-lg text-lg leading-relaxed text-neutral-400">
              A clean terminal for swapping on Arc. Fast, simple, and built for USDC.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3">
              <GradientButton asChild>
                <Link href="/app">Launch App</Link>
              </GradientButton>
              <Link
                href="/arcgrade"
                className="inline-flex min-w-[132px] items-center justify-center rounded-[11px] border border-white/15 px-6 py-4 text-base font-bold text-white transition-colors hover:border-white/35 hover:bg-white/5"
              >
                Check Reputation
              </Link>
            </div>

            <p className="relative z-10 mt-5 text-sm text-neutral-500">
              Launch the app to swap tokens. Check wallet reputation anytime.
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
                <span className="text-sm font-semibold tracking-tight text-neutral-300">Uniswap v4</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <SlidingTestimonial />

      {/* Features */}
      <section className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for trading on Arc
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

      {/* Stats Bar */}
      <section className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            RepDex Onchain Status
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Active Wallets', value: '2,847' },
              { label: 'Total Swap Volume', value: '$142,500' },
              { label: 'Liquidity Added (this month)', value: '$38,200' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-neutral-900/50 px-6 py-5 text-center backdrop-blur transition-colors hover:border-white/20"
              >
                <div className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-neutral-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-neutral-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6">
          <span className="font-semibold tracking-tight text-white">RepDex Terminal</span>
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
