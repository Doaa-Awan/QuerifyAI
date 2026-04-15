import { useState } from 'react';

const DISMISS_KEY = 'querify_ratelimit_dismissed';

export default function RateLimitBanner({ remaining }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === 'false'; }
    catch { return false; }
  });

  if (remaining == null) return null;

  if (remaining >= 10) {
    if (dismissed) return null;
    return (
      <div className="rate-limit-banner rate-limit-banner--info" role="status">
        <span>{remaining} queries remaining today.</span>
        <button
          className="rate-limit-banner__dismiss"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(DISMISS_KEY, 'true');
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  if (remaining >= 1) {
    return (
      <div className="rate-limit-banner rate-limit-banner--warning" role="alert">
        {remaining} {remaining === 1 ? 'query' : 'queries'} remaining today — use them wisely.
      </div>
    );
  }

  // remaining === 0
  return (
    <div className="rate-limit-banner rate-limit-banner--blocked" role="alert">
      Daily limit reached.{' '}
      <a
        href="https://github.com/Doaa-Awan/ai-db-explorer-2026"
        target="_blank"
        rel="noopener noreferrer"
      >
        Clone the repo to use your own API key.
      </a>
    </div>
  );
}
