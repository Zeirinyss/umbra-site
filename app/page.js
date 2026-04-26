"use client";

import React, { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { getUserStatus } from "@/lib/getUserStatus";

export default function Home() {
  const [isApprovedMember, setIsApprovedMember] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const status = await getUserStatus();
    setIsApprovedMember(status.status === "approved");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.4),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.3),transparent_40%)]" />

      <section className="relative border-b border-red-950 bg-black/80 backdrop-blur">

        <div className="mx-auto max-w-7xl px-6 py-6">

          {/* HEADER */}
          <header className="rounded-3xl border border-zinc-900 bg-black/70 backdrop-blur-xl p-4 shadow-2xl shadow-red-950/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              {/* LOGO */}
              <a href="/" className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/40">
                  <img src="/logo.png" className="h-10 w-10" />
                </div>

                <div>
                  <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-red-500">
                    Corporation
                  </p>
                </div>
              </a>

              {/* SINGLE NAV (UserMenu handles everything) */}
              <UserMenu />
            </div>
          </header>

          {/* HERO */}
          <div className="grid gap-12 py-24 lg:grid-cols-[1.1fr_0.9fr] items-center">

            <div>
              <p className="mb-6 inline-block rounded-full border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                RSI Designation: UCOR
              </p>

              {/* FIXED TEXT */}
              <h1 className="text-6xl md:text-7xl font-black leading-tight text-white">
                Victory from the shadows.
              </h1>

              <p className="mt-6 text-lg text-zinc-300 max-w-2xl">
                Umbra Corporation is a private interstellar enterprise built around logistics,
                security, intelligence, racing, and strategic influence.
              </p>

              <p className="mt-5 text-xl italic text-red-400">
                Victoria ex Umbra
              </p>

              <div className="mt-9 flex gap-4 flex-wrap">
                {!isApprovedMember && (
                  <>
                    <a
                      href="https://robertsspaceindustries.com/en/orgs/UCOR"
                      target="_blank"
                      className="rounded-2xl bg-red-700 px-8 py-4 font-black hover:bg-red-600 shadow-lg shadow-red-950/40"
                    >
                      Apply on RSI
                    </a>

                    <a
                      href="/request-access"
                      className="rounded-2xl border border-red-800 px-8 py-4 font-black hover:bg-red-950/30"
                    >
                      Request Access
                    </a>
                  </>
                )}

                <a
                  href="/about"
                  className="rounded-2xl border border-zinc-700 px-8 py-4 font-black hover:border-red-900 hover:bg-zinc-900"
                >
                  Learn More
                </a>
              </div>

              {/* STATS */}
              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <StatCard label="Divisions" value="4" />
                <StatCard label="Founded" value="2955" />
                <StatCard label="Command" value="Active" />
              </div>
            </div>

            {/* VIDEO */}
            <div className="rounded-3xl border border-red-900 bg-black/60 p-6 shadow-2xl shadow-red-950/40">
              <h2 className="text-2xl font-black mb-4">
                Umbra Command Broadcast
              </h2>

              <div className="aspect-video overflow-hidden rounded-xl border border-zinc-800">
                <video
                  src="/org-video.mp4"
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                Official Umbra operations broadcast.
              </p>
            </div>

          </div>
        </div>
      </section>

      <footer className="text-center text-sm text-zinc-500 py-10">
        © 2955 Umbra Corporation / UCOR — Victoria ex Umbra
      </footer>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/60 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}