'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CheckoutPanel() {
  const [status, setStatus] = useState<string>('');
  const [activationCode, setActivationCode] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function openCheckout() {
    setBusy(true);
    setStatus('Preparing secure checkout...');

    try {
      const res = await fetch('/api/paywall/session', { method: 'POST' });
      const data = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Unable to create checkout session');
      }

      const sdkModule = (await import('@lemonsqueezy/lemonsqueezy.js')) as Record<string, unknown>;
      const setup = sdkModule.lemonSqueezySetup;
      const open = sdkModule.openCheckout;

      if (typeof setup === 'function') {
        (setup as (opts: { eventHandler?: (event: unknown) => void }) => void)({});
      }

      if (typeof open === 'function') {
        (open as (opts: { checkoutUrl: string }) => void)({ checkoutUrl: data.checkoutUrl });
      } else {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      }

      setStatus('Checkout launched. After payment, paste your activation code and unlock dashboard access.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Checkout failed';
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  async function unlockAccess() {
    setBusy(true);
    setStatus('Verifying purchase...');

    try {
      const res = await fetch('/api/paywall/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode: activationCode.trim() }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Activation failed');
      }

      setStatus('Access granted. Redirecting to dashboard...');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Activation failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unlock Dashboard Access</CardTitle>
        <CardDescription>Start checkout, then activate with your purchase code to set your access cookie.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button className="w-full" size="lg" onClick={openCheckout} disabled={busy}>
          Open Lemon Squeezy Checkout
        </Button>

        <div className="space-y-2">
          <Label htmlFor="activationCode">Activation Code</Label>
          <Input
            id="activationCode"
            placeholder="Paste the activation code from your purchase"
            value={activationCode}
            onChange={(event) => setActivationCode(event.target.value)}
          />
          <Button variant="secondary" className="w-full" onClick={unlockAccess} disabled={busy || !activationCode.trim()}>
            Unlock Dashboard
          </Button>
        </div>

        <p className="text-sm text-slate-400">
          Need help? Ensure your Lemon Squeezy webhook is configured with this app URL and secret so purchases are activated
          immediately.
        </p>
        {status ? <p className="rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
