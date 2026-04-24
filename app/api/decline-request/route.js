import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const body = await request.json();

  const { email, rsi_handle, reason } = body;

  if (!email || !reason) {
    return NextResponse.json(
      { error: "Missing email or reason." },
      { status: 400 }
    );
  }

  const { error } = await resend.emails.send({
    from: "Umbra Corporation <onboarding@resend.dev>",
    to: email,
    subject: "Umbra Corporation Access Request",
    html: `
      <h2>Umbra Corporation Access Request</h2>
      <p>Hello ${rsi_handle || "Pilot"},</p>
      <p>Your access request has been declined.</p>
      <p><strong>Reason:</strong></p>
      <p>${reason}</p>
      <p>Victoria ex Umbra</p>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}