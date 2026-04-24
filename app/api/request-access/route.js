import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Discord webhook is not configured." },
      { status: 500 }
    );
  }

  const message = {
    embeds: [
      {
        title: "New UCOR Access Request",
        color: 13632027,
        fields: [
          { name: "Email", value: body.email || "N/A", inline: false },
          { name: "RSI Handle", value: body.rsi_handle || "N/A", inline: true },
          { name: "Discord", value: body.discord || "N/A", inline: true },
          { name: "Division", value: body.division || "N/A", inline: true },
        ],
        footer: {
          text: "Umbra Corporation Access System",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const discordResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!discordResponse.ok) {
    return NextResponse.json(
      { error: "Failed to send Discord notification." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}