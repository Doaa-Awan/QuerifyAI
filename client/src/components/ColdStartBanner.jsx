import { useEffect, useState } from 'react';
import { API_BASE } from '../api.js';

const MAX_WAIT_MS = 90_000;
const SHOW_AFTER_MS = 3_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ColdStartBanner() {
  const [state, setState] = useState('idle'); // idle | waking | timeout

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      // Wait 3s before showing anything — fast servers resolve silently
      await sleep(SHOW_AFTER_MS);
      if (cancelled) return;

      // Try once after 3s
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) return; // Server was fast — show nothing
      } catch { /* not yet up */ }

      if (cancelled) return;
      setState('waking');

      // Exponential backoff polling
      let totalWaited = SHOW_AFTER_MS;
      let delay = SHOW_AFTER_MS;

      while (!cancelled && totalWaited < MAX_WAIT_MS) {
        await sleep(delay);
        if (cancelled) return;
        totalWaited += delay;
        delay = Math.min(delay * 2, 30_000);

        try {
          const res = await fetch(`${API_BASE}/health`);
          if (res.ok) {
            setState('idle'); // resolve silently — hide banner
            return;
          }
        } catch { /* keep trying */ }
      }

      if (!cancelled) setState('timeout');
    };

    poll();
    return () => { cancelled = true; };
  }, []);

  if (state === 'idle') return null;

  if (state === 'timeout') {
    return (
      <div className="cold-start-banner cold-start-banner--error" role="status">
        Server is unavailable. Try refreshing in a few minutes.
      </div>
    );
  }

  return (
    <div className="cold-start-banner" role="status" aria-live="polite">
      Waking up the server...
    </div>
  );
}
