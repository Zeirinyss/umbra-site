"use client";

import UserMenu from "@/components/UserMenu";

const divisions = [
  {
    name: "Umbra Logistics Division",
    short: "ULD",
    text: "Resource extraction, transport, trade operations, cargo movement, and industrial support.",
    link: "/logistics",
  },
  {
    name: "Umbra Security Division",
    short: "USD",
    text: "Protection, enforcement, escort, interdiction, and strike operations.",
    link: "/security",
  },
  {
    name: "Umbra Intelligence Network",
    short: "UIN",
    text: "Reconnaissance, data acquisition, espionage, and intelligence control.",
    link: "/intelligence",
  },
  {
    name: "Umbra eSports Division",
    short: "UED",
    text: "Competitive play, racing events, practice, and skill development.",
    link: "/racing",
  },
];

export default function DivisionsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Divisions
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-6xl">
          Operational Branches
        </h1>

        <p className="mt-4 max-w-2xl text-zinc-400">
          Umbra Corporation operates through specialized divisions, each designed
          to dominate a specific aspect of interstellar operations.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {divisions.map((division) => (
            <a key={division.short} href={division.link} className="group">
              <div className="cursor-pointer rounded-3xl border border-zinc-800 bg-zinc-950 p-7 transition hover:border-red-900 hover:bg-black hover:shadow-lg hover:shadow-red-950/20">
                
                <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
                  {division.short}
                </p>

                <h2 className="mt-4 text-2xl font-black transition group-hover:text-red-400">
                  {division.name}
                </h2>

                <p className="mt-4 leading-7 text-zinc-400">
                  {division.text}
                </p>

                <p className="mt-6 text-sm text-red-400 opacity-0 transition group-hover:opacity-100">
                  View Division →
                </p>

              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Victoria ex Umbra
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-red-950 bg-black px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-zinc-900 bg-black/60 p-4 shadow-2xl shadow-red-950/10 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
            <img src="/logo.png" className="h-10 w-10" />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">
              Corporation
            </p>
          </div>
        </a>

               <div className="rounded-2xl border border-zinc-900 bg-zinc-950/70 px-4 py-3">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}