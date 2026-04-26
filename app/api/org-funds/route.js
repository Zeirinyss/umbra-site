import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, note, requestedBy } = await request.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required." },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_ORG_FUNDS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Discord org funds webhook is not configured." },
        { status: 500 }
      );
    }

    const discordMessage = {
      embeds: [
        {
          title: "New Org Funds Deposit Request",
          color: 15158332,
          fields: [
            {
              name: "Amount",
              value: `${Number(amount).toLocaleString()} aUEC`,
              inline: true,
            },
            {
              name: "Requested By",
              value: requestedBy || "Unknown Member",
              inline: true,
            },
            {
              name: "Note",
              value: note || "No note provided.",
            },
          ],
          footer: {
            text: "Umbra Corporation Treasury",
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
      body: JSON.stringify(discordMessage),
    });

    if (!discordResponse.ok) {
      return NextResponse.json(
        { error: "Failed to send org funds request to Discord." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}