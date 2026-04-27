import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function checkCode(request) {
  const code = request.headers.get("x-control-room-code");
  return code && code === process.env.CONTROL_ROOM_CODE;
}

// GET → fetch pending requests
export async function GET(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("member_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data || [] });
}

// POST → approve request
export async function POST(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    requestId,
    email,
    rsi_handle,
    discord,
    division,
    user_id,
  } = await request.json();

  // 1. Insert into members
  const { error: insertError } = await supabaseAdmin
    .from("members")
    .insert({
      email,
      rsi_handle,
      rank: "Member",
      approved: true,
      user_id,
    });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // 2. Update request → approved
  const { error: updateError } = await supabaseAdmin
    .from("member_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}