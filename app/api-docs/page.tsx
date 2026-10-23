'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('score');
  type EndpointInfo = {
    name: string;
    method: string;
    path: string;
    desc: string;
    response: string;
    body?: string;
  };

  const endpoints: Record<string, EndpointInfo> = {
    score: {
      name: 'Get Wallet Score',
      method: 'GET',
      path: '/api/v1/score/[address]',
      desc: 'Retrieves the current trust score for any wallet address on Arc Mainnet.',
      response: `{
  "address": "0x123...abc",
  "score": 87,
  "verdict": "Trusted",
  "lastUpdated": "2026-05-17T12:00:00.000Z",
  "breakdown": {
    "transactionCount": 20,
    "walletAge": 18,
    "consistency": 19,
    "reliability": 17,
    "activityScore": 13
  }
}`
    },
    analyze: {
      name: 'Analyze and Score Wallet',
      method: 'POST',
      path: '/api/v1/analyze',
      desc: 'Triggers a fresh AI analysis and computes the trust score in real-time.',
      body: `{
  "address": "0x123...abc"
}`,
      response: `{
  "address": "0x123...abc",
  "score": 87,
  "verdict": "Based on its activity, this wallet has earned a Trusted rating.",
  "lastUpdated": "2026-05-17T12:05:00.000Z",
  "breakdown": { ... }
}`
    },
    leaderboard: {
      name: 'Get Leaderboard',
      method: 'GET',
      path: '/api/v1/leaderboard?limit=10',
      desc: 'Returns the top scored wallets on Arc Mainnet.',
      response: `{
  "leaderboard": [
    {
      "rank": 1,
      "address": "0x...",
      "score": 98,
      "verdict": "Elite"
    }
  ]
}`
    },
    trusted: {
      name: 'Check if Wallet is Trusted',
      method: 'GET',
      path: '/api/v1/trusted/[address]',
      desc: 'Simple yes/no endpoint for DApps to gate access based on reputation.',
      response: `{
  "address": "0x123...abc",
  "trusted": true,
  "score": 87,
  "minimumScoreRequired": 70
}`
    },
    health: {
      name: 'API Health Check',
      method: 'GET',
      path: '/api/v1/health',
      desc: 'Check if the ArcGrade API is operational.',
      response: `{
  "status": "ok",
  "version": "1.0.0",
  "network": "Arc Mainnet"
}`
    }
  };

  const currentEndpoint = endpoints[activeTab as keyof typeof endpoints];

  return (
    <div className="min-h-screen px-4 pb-16 pt-32">
      <Navbar />

      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            ArcGrade <span className="text-teal">API</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Integrate on-chain reputation directly into your DApp. 
            Gate access, reward users, or analyze wallet behavior with a simple API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <div className="glass-card p-4 mb-4">
              <h3 className="mb-2 uppercase text-xs tracking-widest text-slate-500 font-semibold">Getting Started</h3>
              <ul className="space-y-2">
                <li>
                  <button className="text-sm text-white font-medium hover:underline">Authentication</button>
                </li>
                <li>
                  <button className="text-sm text-slate-500 hover:text-white">Rate Limits</button>
                </li>
                <li>
                  <button className="text-sm text-slate-500 hover:text-white">Errors</button>
                </li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="mb-4 uppercase text-xs tracking-widest text-slate-500 font-semibold">Endpoints</h3>
              <ul className="space-y-2">
                {Object.entries(endpoints).map(([key, ep]) => (
                  <li key={key}>
                    <button
                      onClick={() => setActiveTab(key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        activeTab === key ? 'bg-white/[0.06] text-white font-medium border border-white/[0.08]' : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className={`text-[10px] px-1.5 py-0.5 rounded mr-2 font-bold ${
                        ep.method === 'GET' ? 'bg-sky-400/[0.10] text-sky-300' : 'bg-emerald-400/[0.10] text-emerald-300'
                      }`}>
                        {ep.method}
                      </span>
                      {ep.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 md:p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 rounded-lg text-sm font-semibold tracking-widest ${
                  currentEndpoint.method === 'GET' ? 'bg-sky-400/[0.08] text-sky-300 border border-sky-400/20' : 'bg-emerald-400/[0.08] text-emerald-300 border border-emerald-400/20'
                }`}>
                  {currentEndpoint.method}
                </span>
                <code className="text-slate-200 font-mono text-lg bg-[#081120] px-4 py-1.5 rounded-xl border border-white/[0.08]">
                  {currentEndpoint.path}
                </code>
              </div>

              <p className="text-slate-400 text-lg mb-8">
                {currentEndpoint.desc}
              </p>

              {currentEndpoint.body && (
                <div className="mb-8">
                  <h4 className="mb-3 uppercase text-xs tracking-widest text-slate-500 font-semibold">Request Body</h4>
                  <pre className="bg-[#081120] p-4 rounded-xl border border-white/[0.08] overflow-x-auto">
                    <code className="text-slate-300 font-mono text-sm">{currentEndpoint.body}</code>
                  </pre>
                </div>
              )}

              <div className="mb-8">
                <h4 className="mb-3 uppercase text-xs tracking-widest text-slate-500 font-semibold">Response Example</h4>
                <pre className="bg-[#081120] p-4 rounded-xl border border-white/[0.08] overflow-x-auto">
                  <code className="text-emerald-300/80 font-mono text-sm">{currentEndpoint.response}</code>
                </pre>
              </div>

              {/* Code Snippets */}
              <div className="border-t border-white/[0.08] pt-8">
                <h4 className="mb-4 uppercase text-xs tracking-widest text-slate-500 font-semibold">Code Snippets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#081120] p-4 rounded-xl border border-white/[0.08]">
                    <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">JavaScript (Fetch)</div>
                    <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                      {`fetch('https://arcgrade.app${currentEndpoint.path.replace('[address]', '0x123...')}'${
                        currentEndpoint.method === 'POST' ? `, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ address: '0x123...' })\n}` : ''
                      })\n  .then(res => res.json())\n  .then(console.log);`}
                    </pre>
                  </div>
                  <div className="bg-[#081120] p-4 rounded-xl border border-white/[0.08]">
                    <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">cURL</div>
                    <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                      {`curl -X ${currentEndpoint.method} \\
  https://arcgrade.app${currentEndpoint.path.replace('[address]', '0x123...')}${
    currentEndpoint.method === 'POST' ? ` \\
  -H "Content-Type: application/json" \\
  -d '{"address":"0x123..."}'` : ''
  }`}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="glass-card p-6 border-l border-l-white/15">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Rate Limiting</h3>
                <p className="text-slate-500 text-sm">
                  The API is rate-limited to <strong className="text-slate-300">100 requests per hour</strong> per IP address. 
                  Exceeding this limit will result in a <code className="bg-white/10 px-1 rounded text-slate-300">429 Too Many Requests</code> response.
                </p>
              </div>
              <div className="glass-card p-6 border-l border-l-white/15">
                <h3 className="text-lg font-semibold text-slate-200 mb-2">CORS Enabled</h3>
                <p className="text-slate-500 text-sm">
                  All endpoints support Cross-Origin Resource Sharing (CORS) from any domain (<code className="bg-white/10 px-1 rounded text-slate-300">*</code>), 
                  making it easy to integrate directly into your frontend DApps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
