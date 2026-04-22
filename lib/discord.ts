export interface DiscordAlertPayload {
  title: string;
  body: string;
  fields?: Array<{ name: string; value: string }>;
}

export async function sendDiscordAlert(
  payload: DiscordAlertPayload,
  overrideWebhookUrl?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = overrideWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return { success: false, error: "Missing Discord webhook URL" };
  }

  const embed = {
    title: payload.title,
    description: payload.body,
    color: 0xf97316,
    timestamp: new Date().toISOString(),
    fields: payload.fields,
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      success: false,
      error: `Discord webhook failed (${response.status}): ${text}`,
    };
  }

  return { success: true };
}
