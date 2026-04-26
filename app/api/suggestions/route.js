// app/api/suggestions/route.js

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { title, suggestion, author } = await request.json();

    if (!title || !suggestion) {
      return NextResponse.json(
        { error: "Title and suggestion are required." },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Discord webhook is not configured." },
        { status: 500 }
      );
    }

    const discordMessage = {
      embeds: [
        {
          title: "New Umbra Suggestion",
          color: 12058624,
          fields: [
            {
              name: "Title",
              value: title,
            },
            {
              name: "Suggestion",
              value: suggestion,
            },
            {
              name: "Submitted By",
              value: author || "Unknown Member",
            },
          ],
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
        { error: "Failed to send suggestion to Discord." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}