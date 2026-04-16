'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

const providers = ['openai', 'anthropic', 'google', 'moltbook'] as const;

export function SyncProviders() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function syncAll() {
    setRunning(true);
    setMessage('Syncing yesterday usage from all providers...');

    const results = await Promise.all(
      providers.map(async (provider) => {
        try {
          const response = await fetch(`/api/providers/${provider}`, { method: 'POST' });
          const body = (await response.json()) as { imported?: number; error?: string };

          if (!response.ok) {
            return `${provider}: ${body.error || 'failed'}`;
          }

          return `${provider}: imported ${body.imported ?? 0}`;
        } catch {
          return `${provider}: network error`;
        }
      }),
    );

    setMessage(results.join(' | '));
    setRunning(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={syncAll} disabled={running}>
        {running ? 'Sync in progress...' : 'Sync Yesterday Usage'}
      </Button>
      {message ? <p className="text-xs text-slate-400">{message}</p> : null}
    </div>
  );
}
