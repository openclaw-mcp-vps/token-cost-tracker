export async function sendDiscordBudgetAlert(input: {
  agentId: string;
  monthlySpendUsd: number;
  monthlyBudgetUsd: number;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return { sent: false, reason: "DISCORD_WEBHOOK_URL is not configured." };
  }

  const content = [
    "🚨 **Budget Alert: Agent overspend detected**",
    `Agent: \`${input.agentId}\``,
    `Monthly spend: **$${input.monthlySpendUsd.toFixed(2)}**`,
    `Budget: **$${input.monthlyBudgetUsd.toFixed(2)}**`,
    "Review recent workflow usage in Token Cost Tracker dashboard."
  ].join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "Token Cost Tracker",
      content
    })
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}`);
  }

  return { sent: true };
}
