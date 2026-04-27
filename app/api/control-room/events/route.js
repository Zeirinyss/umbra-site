import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function checkCode(request) {
  const code = request.headers.get("x-control-room-code");
  return code && code === process.env.CONTROL_ROOM_CODE;
}

export async function GET(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data || [] });
}

export async function POST(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabaseAdmin.from("events").insert({
    title: body.title,
    description: body.description,
    location: body.location,
    event_type: body.event_type,
    start_time: body.start_time,
    end_time: body.end_time,
    created_by: null,
    discord_sent: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      title: body.title,
      description: body.description,
      location: body.location,
      event_type: body.event_type,
      start_time: body.start_time,
      end_time: body.end_time,
      discord_sent: false,
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  if (!checkCode(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  const { error } = await supabaseAdmin.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}