"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppCommandComms() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("app-command-comms-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "command_comms" },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadMessages() {
    const { data } = await supabase
      .from("command_comms")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(data || []);
  }

  async function sendMessage(e) {
    e.preventDefault();

    if (!message.trim()) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      alert("Not logged in");
      return;
    }

    await supabase.from("command_comms").insert({
      user_id: user.id,
      rsi_handle: user.email,
      message: message.trim(),
    });

    setMessage("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <h1 className="mb-4 text-2xl font-black">Command Comms</h1>

      <div className="mb-4 h-[70vh] space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-black p-3">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded-xl bg-zinc-900 p-3">
            <p className="text-sm font-bold text-red-400">
              {msg.rsi_handle || "Member"}
            </p>
            <p className="mt-1 text-sm text-zinc-200">{msg.message}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          className="flex-1 rounded-xl bg-zinc-900 p-3 outline-none"
        />

        <button className="rounded-xl bg-red-700 px-4 font-black">
          Send
        </button>
      </form>
    </main>
  );
}