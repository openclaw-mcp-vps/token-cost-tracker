import { NextResponse } from 'next/server';

import { getRunawayAlertsWithWebhooks } from '@/lib/database';
import { sendDiscordBudgetAlert } from '@/lib/discord';
import { syncProvider } from '@/lib/providers';

export async function POST() {
  try {
    const result = await syncProvider('google');
    const alerts = await getRunawayAlertsWithWebhooks();

    await Promise.all(
      alerts.map((alert) =>
        sendDiscordBudgetAlert({
          webhookUrl: alert.discordWebhookUrl!,
          agent: alert.agent,
          monthlySpend: alert.spend,
          monthlyBudget: alert.budget,
        }),
      ),
    );

    return NextResponse.json({ provider: 'google', imported: result.imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
