import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getBudgets, prisma } from '@/lib/database';

const bodySchema = z.object({
  agent: z.string().min(1),
  monthlyBudgetUsd: z.number().positive(),
  discordWebhookUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    const budgets = await getBudgets();
    return NextResponse.json({ budgets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load budgets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid budget payload' }, { status: 400 });
    }

    const budget = await prisma.budget.upsert({
      where: { agent: parsed.data.agent },
      create: {
        agent: parsed.data.agent,
        monthlyBudgetUsd: parsed.data.monthlyBudgetUsd,
        discordWebhookUrl: parsed.data.discordWebhookUrl,
      },
      update: {
        monthlyBudgetUsd: parsed.data.monthlyBudgetUsd,
        discordWebhookUrl: parsed.data.discordWebhookUrl,
      },
    });

    return NextResponse.json({ budget });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save budget';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
