// ArcGrade Content Script
// Detects wallet address on ArcScan and injects a floating badge

const API_URL = 'https://arc-grade.vercel.app/api/analyze';

function init() {
  // Check if we're on an address page
  const match = window.location.pathname.match(/\/address\/(0x[a-fA-F0-9]{40})/i);
  if (!match) return; // Not an address page

  const address = match[1];
  
  // Inject the UI
  injectUI(address);
  
  // Fetch data
  fetchScore(address);
}

function injectUI(address) {
  // Check if already injected
  if (document.getElementById('arcgrade-extension-root')) return;

  const root = document.createElement('div');
  root.id = 'arcgrade-extension-root';

  const iconUrl = chrome.runtime.getURL('icons/icon48.png');

  root.innerHTML = `
    <div class="arcgrade-badge arcgrade-visible" id="arcgrade-badge">
      <div class="arcgrade-header">
        <div class="arcgrade-brand">
          <img src="${iconUrl}" class="arcgrade-logo-small" alt="Logo" />
          ArcGrade
        </div>
        <button class="arcgrade-close" id="arcgrade-close" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="arcgrade-content" id="arcgrade-content">
        <!-- Loading State -->
        <div class="arcgrade-loading">
          <div class="arcgrade-spinner"></div>
          <div>Analyzing wallet...</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // Close handler
  document.getElementById('arcgrade-close').addEventListener('click', () => {
    const badge = document.getElementById('arcgrade-badge');
    badge.classList.remove('arcgrade-visible');
    setTimeout(() => root.remove(), 300);
  });
}

async function fetchScore(address) {
  const contentEl = document.getElementById('arcgrade-content');
  if (!contentEl) return;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address })
    });

    if (!response.ok) throw new Error('API Error');

    const data = await response.json();
    
    if (data.error) throw new Error(data.error);

    renderScore(address, data);
  } catch (err) {
    console.error('ArcGrade Extension Error:', err);
    contentEl.innerHTML = `
      <div class="arcgrade-error">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px;opacity:0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div style="margin-bottom:8px">Not scored yet</div>
        <a href="https://arc-grade.vercel.app/score/${address}" target="_blank" class="arcgrade-btn" style="padding: 6px 12px; margin-top: 8px;">Click to analyze</a>
      </div>
    `;
  }
}

function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function renderScore(address, data) {
  const contentEl = document.getElementById('arcgrade-content');
  if (!contentEl) return;

  const score = data.score || 0;
  const level = data.trustLevel || 'Neutral';
  const verdict = data.verdict || 'Analysis completed.';
  const shortAddress = shortenAddress(address);
  
  const pct = score + '%';

  contentEl.innerHTML = `
    <div class="arcgrade-address-badge">${shortAddress}</div>
    <div class="arcgrade-score-header">
      <div class="arcgrade-trust-level arcgrade-level-${level}">${level}</div>
      <div class="arcgrade-score-number">${score}<span class="arcgrade-score-max">/100</span></div>
    </div>
    <div class="arcgrade-progress-bg">
      <div class="arcgrade-progress-bar arcgrade-bg-${level}" style="width: ${pct}"></div>
    </div>
    <div class="arcgrade-verdict arcgrade-border-${level}">${verdict}</div>
    <a href="https://arc-grade.vercel.app/score/${address}" target="_blank" class="arcgrade-btn">View Full Report</a>
  `;
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Support single-page application navigation (if ArcScan uses client-side routing)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Remove existing if any
    const existing = document.getElementById('arcgrade-extension-root');
    if (existing) existing.remove();
    // Re-init
    setTimeout(init, 500);
  }
}).observe(document, { subtree: true, childList: true });
