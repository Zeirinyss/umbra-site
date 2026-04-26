"use client";

import UserMenu from "@/components/UserMenu";

const leadership = [
  { handle: "TheBunnynator1001", title: "CEO", division: "Executive Command" },
  { handle: "Reaper-O-Lykos", title: "COO", division: "Executive Command" },
  { handle: "CyclopsVision", title: "Director of USD", division: "Umbra Security Division" },
  { handle: "RagingHate", title: "Director of ULD", division: "Umbra Logistics Division" },
  { handle: "Zeirinyss", title: "Director of UED", division: "Umbra eSports Division" },
];

export default function LeadershipPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Board of Directors
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-6xl">
          Leadership Roster
        </h1>

        <p className="mt-4 max-w-2xl text-zinc-400">
          The command structure of Umbra Corporation, overseeing all divisions,
          operations, and strategic direction.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leadership.map((leader) => (
            <div
              key={leader.handle}
              className="rounded-3xl border border-zinc-800 bg-black/60 p-6 transition hover:border-red-900 hover:bg-zinc-950"
            >
              <p className="text-2xl font-black">{leader.handle}</p>

              <p className="mt-2 text-red-400">{leader.title}</p>

              <p className="mt-3 text-sm text-zinc-500">
                {leader.division}
              </p>
            </div>
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