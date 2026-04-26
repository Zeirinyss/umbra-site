"use client";

import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { getUserStatus } from "@/lib/getUserStatus";

export default function SuggestionsPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [status, setStatus] = useState("loading");

  const [title, setTitle] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const userStatus = await getUserStatus();

    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setStatus(userStatus.status || "guest");
  }

  async function submitSuggestion(event) {
    event.preventDefault();
    setMessage("");

    if (!title.trim() || !suggestion.trim()) {
      setMessage("Please fill out both fields.");
      return;
    }

    setSending(true);

    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
        suggestion: suggestion.trim(),
        author: member?.rsi_handle || user?.email || "Unknown Member",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Failed to send suggestion.");
      setSending(false);
      return;
    }

    setTitle("");
    setSuggestion("");
    setMessage("Suggestion sent to Discord.");
    setSending(false);
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          Loading...
        </div>
      </main>
    );
  }

  if (!user || status !== "approved") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <Header />

        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-red-900 bg-black/60 p-8">
            <h1 className="text-3xl font-black">Suggestions Restricted</h1>
            <p className="mt-4 text-zinc-400">
              You must be an approved Umbra member to submit suggestions.
            </p>

            <a
              href="/login"
              className="mt-6 inline-block rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
            >
              Login
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Umbra Corporation
        </p>

        <h1 className="mt-4 text-5xl font-black">Submit Suggestion</h1>

        <p className="mt-4 text-zinc-400">
          Send website, event, fleet, division, or organization suggestions
          directly to Umbra command through Discord.
        </p>

        <form
          onSubmit={submitSuggestion}
          className="mt-10 rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10"
        >
          {message && (
            <div className="mb-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
              {message}
            </div>
          )}

          <div className="grid gap-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Suggestion title"
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Explain your suggestion..."
              className="min-h-40 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Suggestion"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-red-950 bg-black px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/10 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
            <img src="/logo.png" alt="Umbra Logo" className="h-10 w-10 object-contain" />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
              Corporation
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
  );
}