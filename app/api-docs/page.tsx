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
      desc: 'Retrieves the current trust score for any wallet address on Arc Testnet.',
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
      desc: 'Returns the top scored wallets on Arc Testnet.',
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
  "network": "Arc Testnet"
}`
    }
  };

  const currentEndpoint = endpoints[activeTab as keyof typeof endpoints];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <Navbar />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            ArcGrade <span className="text-teal-light">API</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Integrate on-chain reputation directly into your DApp. 
            Gate access, reward users, or analyze wallet behavior with a simple API.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <div className="glass-card p-4 mb-4">
              <h3 className="text-white font-bold mb-2 uppercase text-xs tracking-widest text-white/50">Getting Started</h3>
              <ul className="space-y-2">
                <li>
                  <button className="text-sm text-teal-light font-bold hover:underline">Authentication</button>
                </li>
                <li>
                  <button className="text-sm text-white/70 hover:text-white">Rate Limits</button>
                </li>
                <li>
                  <button className="text-sm text-white/70 hover:text-white">Errors</button>
                </li>
              </ul>
            </div>

            <div className="glass-card p-4">
              <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-white/50">Endpoints</h3>
              <ul className="space-y-2">
                {Object.entries(endpoints).map(([key, ep]) => (
                  <li key={key}>
                    <button
                      onClick={() => setActiveTab(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === key ? 'bg-teal-light/20 text-teal-light font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`text-[10px] px-1.5 py-0.5 rounded mr-2 font-bold ${
                        ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
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
                <span className={`px-3 py-1 rounded-lg text-sm font-black tracking-widest ${
                  currentEndpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {currentEndpoint.method}
                </span>
                <code className="text-white/80 font-mono text-lg bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
                  {currentEndpoint.path}
                </code>
              </div>

              <p className="text-white/70 text-lg mb-8">
                {currentEndpoint.desc}
              </p>

              {currentEndpoint.body && (
                <div className="mb-8">
                  <h4 className="text-white font-bold mb-3 uppercase text-xs tracking-widest text-white/50">Request Body</h4>
                  <pre className="bg-[#0f172a]/80 p-4 rounded-xl border border-white/10 overflow-x-auto">
                    <code className="text-teal-light font-mono text-sm">{currentEndpoint.body}</code>
                  </pre>
                </div>
              )}

              <div className="mb-8">
                <h4 className="text-white font-bold mb-3 uppercase text-xs tracking-widest text-white/50">Response Example</h4>
                <pre className="bg-[#0f172a]/80 p-4 rounded-xl border border-white/10 overflow-x-auto">
                  <code className="text-green-400 font-mono text-sm">{currentEndpoint.response}</code>
                </pre>
              </div>

              {/* Code Snippets */}
              <div className="border-t border-white/10 pt-8">
                <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest text-white/50">Code Snippets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0f172a]/80 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-2 font-bold uppercase">JavaScript (Fetch)</div>
                    <pre className="text-xs text-white/80 overflow-x-auto font-mono">
                      {`fetch('https://arcgrade.app${currentEndpoint.path.replace('[address]', '0x123...')}'${
                        currentEndpoint.method === 'POST' ? `, {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ address: '0x123...' })\n}` : ''
                      })\n  .then(res => res.json())\n  .then(console.log);`}
                    </pre>
                  </div>
                  <div className="bg-[#0f172a]/80 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-2 font-bold uppercase">cURL</div>
                    <pre className="text-xs text-white/80 overflow-x-auto font-mono">
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
              <div className="glass-card p-6 border-l-4 border-l-teal-light">
                <h3 className="text-lg font-bold text-white mb-2">Rate Limiting</h3>
                <p className="text-white/60 text-sm">
                  The API is rate-limited to <strong>100 requests per hour</strong> per IP address. 
                  Exceeding this limit will result in a <code className="bg-white/10 px-1 rounded text-teal-light">429 Too Many Requests</code> response.
                </p>
              </div>
              <div className="glass-card p-6 border-l-4 border-l-green-400">
                <h3 className="text-lg font-bold text-white mb-2">CORS Enabled</h3>
                <p className="text-white/60 text-sm">
                  All endpoints support Cross-Origin Resource Sharing (CORS) from any domain (<code className="bg-white/10 px-1 rounded text-teal-light">*</code>), 
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
