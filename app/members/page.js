"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    const status = await getUserStatus();

    if (status.status === "guest") {
      window.location.href = "/login";
      return;
    }

    if (status.status === "pending") {
      window.location.href = "/pending";
      return;
    }

    fetchMembers();
  }

  async function fetchMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("approved", true)
      .order("rsi_handle", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMembers(data || []);
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Umbra Corporation
          </p>

          <h1 className="mt-3 text-5xl font-black">Members</h1>

          <p className="mt-3 max-w-2xl text-zinc-400">
            Approved UCOR member registry.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
              Home
            </a>

            <a href="/fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
              Org Fleet
            </a>

            <a href="/my-fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
              My Fleet
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-200">
            {message}
          </div>
        )}

        {members.length === 0 && !message ? (
          <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
            No members found.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <a
                key={member.id}
                href={`/members/${member.id}`}
                className="rounded-3xl border border-zinc-800 bg-black/60 p-5 transition hover:border-red-900 hover:bg-zinc-950"
              >
                <h2 className="text-2xl font-black">
                  {member.rsi_handle || "Unknown Handle"}
                </h2>

                <p className="mt-2 text-red-400">
                  {member.rank || "Member"}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {member.email}
                </p>

                <span className="mt-5 inline-block rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-200">
                  View Profile
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}