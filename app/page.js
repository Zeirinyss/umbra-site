"use client";

import React from "react";
import UserMenu from "@/components/UserMenu";

const leadership = [
  { handle: "TheBunnynator1001", title: "CEO", division: "Executive Command" },
  { handle: "Reaper-O-Lykos", title: "COO", division: "Executive Command" },
  { handle: "CyclopsVision", title: "Director of USD", division: "Umbra Security Division" },
  { handle: "RagingHate", title: "Director of ULD", division: "Umbra Logistics Division" },
  { handle: "Zeirinyss", title: "Director of UED", division: "Umbra eSports Division" },
];

const divisions = [
  {
    name: "Umbra Logistics Division",
    short: "ULD",
    text: "Resource extraction, transport, trade operations, cargo movement, and industrial support.",
  },
  {
    name: "Umbra Security Division",
    short: "USD",
    text: "Protection, enforcement, escort, interdiction, and strike operations.",
  },
  {
    name: "Umbra Intelligence Network",
    short: "UIN",
    text: "Reconnaissance, data acquisition, espionage, and intelligence control.",
  },
  {
    name: "Umbra eSports Division",
    short: "UED",
    text: "Competitive play, racing events, practice, and skill development.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-red-950 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.35),transparent_38%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 py-6">
          <header className="rounded-3xl border border-zinc-900 bg-black/60 p-4 shadow-2xl shadow-red-950/10 backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <a href="/" className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
                  <img
                    src="/logo.png"
                    alt="Umbra Logo"
                    className="h-10 w-10 object-contain"
                  />
                </div>

                <div>
                  <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
                    Corporation
                  </p>
                </div>
              </a>

              <nav className="flex flex-wrap items-center gap-5 text-sm font-bold text-zinc-300">
                <a href="#about" className="hover:text-red-400">
                  About
                </a>
                <a href="#leadership" className="hover:text-red-400">
                  Leadership
                </a>
                <a href="#divisions" className="hover:text-red-400">
                  Divisions
                </a>
              </nav>

              <div className="rounded-2xl border border-zinc-900 bg-zinc-950/70 px-4 py-3 text-sm font-bold text-zinc-300">
                <UserMenu />
              </div>
            </div>
          </header>

          <div className="grid gap-12 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="mb-6 inline-block rounded-full border border-red-900 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-300">
                RSI Designation: UCOR
              </p>

              <h1 className="max-w-4xl text-6xl font-black leading-tight md:text-7xl">
                Victory from the shadows.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                Umbra Corporation is a private interstellar enterprise built around
                logistics, security, intelligence, racing, and strategic influence.
              </p>

              <p className="mt-5 text-xl font-bold italic text-red-400">
                Victoria ex Umbra
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="/request-access"
                  className="rounded-2xl bg-red-700 px-8 py-4 font-black shadow-lg shadow-red-950/40 hover:bg-red-600"
                >
                  Request Access
                </a>

                <a
                  href="#divisions"
                  className="rounded-2xl border border-red-800 bg-black/50 px-8 py-4 font-black hover:bg-red-950/30"
                >
                  View Divisions
                </a>

                <a
                  href="#about"
                  className="rounded-2xl border border-zinc-800 bg-black/50 px-8 py-4 font-black hover:border-red-900 hover:bg-zinc-900"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <StatCard label="Divisions" value="4" />
                <StatCard label="Command Motto" value="Victoria" />
                <StatCard label="Founded" value="2955" />
              </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-red-900 bg-black/60 p-8 shadow-2xl shadow-red-950/30">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-10 text-center">
                <img
                  src="/logo.png"
                  alt="Umbra Logo"
                  className="mx-auto h-40 w-40 object-contain"
                />
                <p className="mt-8 text-4xl font-black tracking-[0.35em]">UCOR</p>
                <p className="mt-3 text-xs uppercase tracking-[0.35em] text-zinc-400">
                  Umbra Corporation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              About
            </p>
            <h2 className="mt-4 text-4xl font-black md:text-5xl">
              Built in shadow. Directed by purpose.
            </h2>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-black/60 p-8 leading-8 text-zinc-300">
            <p>
              Umbra Corporation is an autonomous, self-governing organization built
              around secrecy, profit, unity, and strategic control. Members operate
              across specialized divisions to secure resources, gather intelligence,
              enforce corporate interests, and compete at the highest level.
            </p>
          </div>
        </div>
      </section>

      <section id="divisions" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Divisions
          </p>
          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Operational branches.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {divisions.map((division) => (
              <div
                key={division.short}
                className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-red-900 hover:bg-black"
              >
                <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
                  {division.short}
                </p>
                <h3 className="mt-4 text-2xl font-black">{division.name}</h3>
                <p className="mt-4 leading-7 text-zinc-400">{division.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="leadership" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Board of Directors
        </p>
        <h2 className="mt-4 text-4xl font-black md:text-5xl">
          Leadership Roster
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {leadership.map((leader) => (
            <div
              key={leader.handle}
              className="rounded-3xl border border-zinc-800 bg-black/60 p-6 transition hover:border-red-900 hover:bg-zinc-950"
            >
              <p className="text-2xl font-black">{leader.handle}</p>
              <p className="mt-2 text-red-400">{leader.title}</p>
              <p className="mt-3 text-sm text-zinc-500">{leader.division}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="history" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            History
          </p>
          <h2 className="mt-4 text-4xl font-black">Founding — 2955</h2>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <InfoCard
              title="Origin"
              text="Founded during a turbulent economic period as frontier systems became increasingly unstable."
            />
            <InfoCard
              title="Opportunity"
              text="Where others saw chaos, Umbra identified structure, leverage, and strategic advantage."
            />
            <InfoCard
              title="Early Operations"
              text="Umbra began as a grey ops assault team specializing in covert operations and tactical reconnaissance."
            />
          </div>
        </div>
      </section>

      <section id="manifesto" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Manifesto
        </p>
        <h2 className="mt-4 text-4xl font-black">Victoria ex Umbra</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ManifestoSection title="I. Our Origin">
            Born in the void between stars, Umbra was not built on ideals. It was built on necessity.
          </ManifestoSection>

          <ManifestoSection title="II. Our Vision">
            To command the frontier from the shadows and control the flow of information, resources, and power.
          </ManifestoSection>

          <ManifestoSection title="III. Our Structure">
            Umbra operates through dedicated divisions, each serving a vital role in the corporate machine.
          </ManifestoSection>

          <ManifestoSection title="IV. Our Code">
            Secrecy is Strength. Profit is Power. Unity in Shadow. Adapt. Endure. Overcome.
          </ManifestoSection>
        </div>
      </section>

      <section id="charter" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Charter
          </p>
          <h2 className="mt-4 text-4xl font-black">
            Umbra Corporation Charter
          </h2>
          <p className="mt-3 text-red-400 italic">Victoria ex Umbra</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <CharterArticle title="Article I — Name and Nature">
              Umbra Corporation is a private interstellar enterprise operating across the UEE and beyond.
            </CharterArticle>

            <CharterArticle title="Article II — Purpose">
              Umbra exists to expand influence, acquire assets, provide security, and ensure member advancement.
            </CharterArticle>

            <CharterArticle title="Article III — Structure">
              Umbra is divided into primary divisions under the authority of the Board of Directors.
            </CharterArticle>
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Victoria ex Umbra
      </footer>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/60 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-4 leading-7 text-zinc-400">{text}</p>
    </div>
  );
}

function ManifestoSection({ title, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-black/60 p-7">
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 leading-7 text-zinc-400">{children}</p>
    </section>
  );
}

function CharterArticle({ title, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 leading-7 text-zinc-400">{children}</p>
    </section>
  );
}