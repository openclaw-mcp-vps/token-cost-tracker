export async function sendDiscordBudgetAlert(
  webhookUrl: string,
  payload: {
    agentId: string;
    month: string;
    spendUsd: number;
    budgetUsd: number;
    providerBreakdown: Record<string, number>;
  }
): Promise<void> {
  const breakdown = Object.entries(payload.providerBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([provider, value]) => `• ${provider}: $${value.toFixed(2)}`)
    .join("\n");

  const content = [
    `🚨 Agent budget exceeded for ${payload.month}`,
    `Agent: ${payload.agentId}`,
    `Spend: $${payload.spendUsd.toFixed(2)} (budget: $${payload.budgetUsd.toFixed(2)})`,
    "",
    "Provider breakdown:",
    breakdown || "• No provider-level breakdown available"
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      content,
      username: "Token Cost Tracker"
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${text}`);
  }
}
