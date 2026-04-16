import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendDiscordBudgetAlert } from '@/lib/discord';

const bodySchema = z.object({
  agent: z.string().min(1),
  monthlySpend: z.number().nonnegative(),
  monthlyBudget: z.number().nonnegative(),
  webhookUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.parse(json);

    const webhookUrl = parsed.webhookUrl ?? process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'No webhook URL configured' }, { status: 400 });
    }

    await sendDiscordBudgetAlert({
      webhookUrl,
      agent: parsed.agent,
      monthlySpend: parsed.monthlySpend,
      monthlyBudget: parsed.monthlyBudget,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send Discord alert';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
