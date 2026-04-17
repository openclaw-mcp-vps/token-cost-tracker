import { NextResponse } from "next/server";
import { z } from "zod";
import { getMonthlyAgentSpend } from "@/lib/database";
import { sendDiscordBudgetAlert } from "@/lib/discord";

const payloadSchema = z.object({
  agentId: z.string().min(1),
  monthlyBudgetUsd: z.number().positive()
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());

    const monthlySpend = await getMonthlyAgentSpend();
    const agent = monthlySpend.find((entry) => entry.agent_id === payload.agentId);
    const currentSpend = Number(agent?.total_cost_usd ?? 0);

    if (currentSpend <= payload.monthlyBudgetUsd) {
      return NextResponse.json({
        message: `No alert sent. ${payload.agentId} is at $${currentSpend.toFixed(2)} of $${payload.monthlyBudgetUsd.toFixed(2)}.`
      });
    }

    await sendDiscordBudgetAlert({
      agentId: payload.agentId,
      monthlySpendUsd: currentSpend,
      monthlyBudgetUsd: payload.monthlyBudgetUsd
    });

    return NextResponse.json({
      message: `Alert sent. ${payload.agentId} is at $${currentSpend.toFixed(2)} and over budget.`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid alert payload" },
      { status: 400 }
    );
  }
}
