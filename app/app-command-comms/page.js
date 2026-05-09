"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppCommandComms() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("app-command-comms-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "command_comms" },
        () => {
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log("Command comms realtime status:", status);
      });

    const refreshTimer = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("command_comms")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Failed to load messages:", error);
      return;
    }

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

    const { data: member } = await supabase
      .from("members")
      .select("rsi_handle")
      .eq("email", user.email)
      .maybeSingle();

    const displayName = member?.rsi_handle || user.email;

    const { error } = await supabase.from("command_comms").insert({
      user_id: user.id,
      rsi_handle: displayName,
      message: message.trim(),
    });

    if (error) {
      console.error("Failed to send message:", error);
      alert("Message failed to send.");
      return;
    }

    setMessage("");
    loadMessages();
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

            <p className="mt-1 text-sm text-zinc-200">
              {msg.message}
            </p>
          </div>
        ))}

        <div ref={messagesEndRef} />
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