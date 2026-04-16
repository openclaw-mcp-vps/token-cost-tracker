type DiscordAlertPayload = {
  webhookUrl: string;
  agent: string;
  monthlySpend: number;
  monthlyBudget: number;
};

export async function sendDiscordBudgetAlert(payload: DiscordAlertPayload) {
  const overBy = payload.monthlySpend - payload.monthlyBudget;

  const response = await fetch(payload.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: [
        `Budget alert for ${payload.agent}`,
        `Spend this month: $${payload.monthlySpend.toFixed(2)}`,
        `Budget: $${payload.monthlyBudget.toFixed(2)}`,
        `Over budget by: $${overBy.toFixed(2)}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${body}`);
  }
}
