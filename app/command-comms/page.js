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
    if (status !== "approved") return;

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
          setMessages((current) => {
            const exists = current.some((msg) => msg.id === payload.new.id);
            if (exists) return current;
            return [...current, payload.new];
          });
        }
      )
      .subscribe((subscriptionStatus) => {
        console.log("Command Comms realtime:", subscriptionStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

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
      <main className="h-screen overflow-hidden bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          <Header />
          <p className="mt-10 text-zinc-400">Loading Command Comms...</p>
        </div>
      </main>
    );
  }

  if (status !== "approved") {
    return (
      <main className="h-screen overflow-hidden bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
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
    <main className="relative h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.18),transparent_35%)] opacity-40" />

      <div className="relative mx-auto flex h-screen max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-6">
        <Header />

        <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-red-900 bg-black/70 shadow-2xl shadow-red-950/30 sm:mt-6 sm:rounded-3xl">
          <div className="shrink-0 border-b border-zinc-800 bg-black/80 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">
              Umbra Internal Network
            </p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">
              Command Comms
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Live members-only communication feed.
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:space-y-4 sm:p-5">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-zinc-500">
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
                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-lg sm:max-w-[80%] sm:px-5 ${
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
            className="shrink-0 border-t border-zinc-800 bg-black/90 p-3 sm:p-4"
          >
            <div className="flex gap-2 sm:gap-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-700 sm:px-5"
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="shrink-0 rounded-2xl bg-red-700 px-4 py-3 font-black transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
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
    <header className="shrink-0 rounded-2xl border border-zinc-900 bg-black/70 p-3 shadow-2xl shadow-red-950/30 backdrop-blur-xl sm:rounded-3xl sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/40 sm:h-14 sm:w-14">
            <img src="/logo.png" className="h-9 w-9 sm:h-10 sm:w-10" alt="Umbra Logo" />
          </div>

          <div>
            <p className="text-xl font-black tracking-[0.25em] sm:text-2xl">
              UMBRA
            </p>
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