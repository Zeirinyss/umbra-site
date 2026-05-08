"use client";

import { useEffect, useRef, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function CommandCommsPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [status, setStatus] = useState("loading");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel("command-comms-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "command_comms",
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadPage() {
    const userStatus = await getUserStatus();

    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setStatus(userStatus.status || "guest");

    if (userStatus.status !== "approved") return;

    const { data, error } = await supabase
      .from("command_comms")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();

    if (!message.trim() || !user) return;

    setSending(true);

    const { error } = await supabase.from("command_comms").insert({
      user_id: user.id,
      rsi_handle: member?.rsi_handle || user.email,
      message: message.trim(),
    });

    setSending(false);

    if (error) {
      alert("Message failed to send.");
      return;
    }

    setMessage("");
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Header />
          <p className="mt-10 text-zinc-400">Loading Command Comms...</p>
        </div>
      </main>
    );
  }

  if (status !== "approved") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Header />

          <div className="mt-12 rounded-3xl border border-red-900 bg-black/60 p-8">
            <h1 className="text-3xl font-black">Access Denied</h1>
            <p className="mt-3 text-zinc-400">
              Command Comms is only available to approved Umbra members.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.18),transparent_35%)] opacity-40" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
        <Header />

        <section className="mt-8 flex min-h-[75vh] flex-1 flex-col overflow-hidden rounded-3xl border border-red-900 bg-black/70 shadow-2xl shadow-red-950/30">
          <div className="border-b border-zinc-800 bg-black/80 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">
              Umbra Internal Network
            </p>
            <h1 className="mt-1 text-3xl font-black">Command Comms</h1>
            <p className="mt-2 text-sm text-zinc-500">
              Live members-only communication feed.
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-zinc-500">
                No messages yet. Start the first transmission.
              </div>
            )}

            {messages.map((item) => {
              const isMine = item.user_id === user?.id;

              return (
                <div
                  key={item.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-lg ${
                      isMine
                        ? "rounded-br-sm bg-red-700 text-white shadow-red-950/30"
                        : "rounded-bl-sm border border-zinc-800 bg-zinc-950 text-zinc-200"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <p
                        className={`text-xs font-black ${
                          isMine ? "text-red-100" : "text-red-400"
                        }`}
                      >
                        {isMine ? "You" : item.rsi_handle || "Unknown Member"}
                      </p>

                      <p
                        className={`text-[10px] ${
                          isMine ? "text-red-200" : "text-zinc-500"
                        }`}
                      >
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-zinc-800 bg-black/90 p-4"
          >
            <div className="flex gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-700"
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="rounded-2xl bg-red-700 px-6 py-3 font-black transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/30 backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/40">
            <img src="/logo.png" className="h-10 w-10" alt="Umbra Logo" />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">
              Corporation
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
  );
}