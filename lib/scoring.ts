import { WalletData } from './arcApi';

export interface ScoreBreakdown {
  txScore: number;        // 0-25
  ageScore: number;       // 0-20
  consistencyScore: number; // 0-20
  avgValueScore: number;  // 0-20
  reliabilityScore: number; // 0-15
  total: number;          // 0-100
}

export type TrustLevel = 'Elite' | 'Trusted' | 'Neutral' | 'Risky' | 'Untrusted';

export function computeScore(data: WalletData): ScoreBreakdown {
  // Transaction count score (0-25)
  const txScore = Math.min(25, Math.floor((data.txCount / 100) * 25));

  // Wallet age score (0-20): full score at 365+ days
  const ageScore = Math.min(20, Math.floor((data.walletAgeInDays / 365) * 20));

  // Consistency score (0-20): based on regular activity
  // If wallet has txns and age, compute activity density
  let consistencyScore = 0;
  if (data.txCount > 0 && data.walletAgeInDays > 0) {
    const txPerDay = data.txCount / Math.max(data.walletAgeInDays, 1);
    // 0.1 tx/day = 10 pts, 0.5 tx/day = 20 pts
    consistencyScore = Math.min(20, Math.floor(txPerDay * 40));
  }

  // Average value score (0-20): higher avg value = higher score
  const avgValueScore = Math.min(20, Math.floor(Math.log1p(data.avgTxValue) * 6));

  // Reliability score (0-15): fewer failed txns = higher score
  let reliabilityScore = 15;
  if (data.txCount > 0) {
    const failRatio = data.failedTxCount / data.txCount;
    reliabilityScore = Math.max(0, Math.floor(15 * (1 - failRatio * 3)));
  }

  const total = Math.min(100, txScore + ageScore + consistencyScore + avgValueScore + reliabilityScore);

  return { txScore, ageScore, consistencyScore, avgValueScore, reliabilityScore, total };
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Trusted';
  if (score >= 50) return 'Neutral';
  if (score >= 25) return 'Risky';
  return 'Untrusted';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#00e5a0'; // Elite (Green)
  if (score >= 75) return '#4a9aba'; // Trusted (Blue)
  if (score >= 50) return '#ffd700'; // Neutral (Gold)
  if (score >= 25) return '#ff9f43'; // Risky (Orange)
  return '#ff6b6b';                 // Untrusted (Red)
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Trusted';
  if (score >= 50) return 'Good';
  if (score >= 30) return 'Fair';
  if (score >= 10) return 'Poor';
  return 'Unknown';
}

export function getBadge(score: number): { label: string; emoji: string; cls: string } {
  if (score >= 90) return { label: 'Elite',     emoji: '🥇', cls: 'badge-elite'     };
  if (score >= 75) return { label: 'Trusted',   emoji: '🌟', cls: 'badge-trusted'   };
  if (score >= 50) return { label: 'Neutral',   emoji: '✅', cls: 'badge-neutral'   };
  if (score >= 25) return { label: 'Risky',     emoji: '⚠️', cls: 'badge-risky'     };
  return               { label: 'Untrusted', emoji: '❌', cls: 'badge-untrusted' };
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
