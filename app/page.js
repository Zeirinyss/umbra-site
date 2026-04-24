"use client";

import React from "react";

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
    text: "Private military protection, enforcement, escort, interdiction, and covert strike operations.",
  },
  {
    name: "Umbra Intelligence Network",
    short: "UIN",
    text: "Reconnaissance, data acquisition, espionage, intelligence gathering, and information control.",
  },
  {
    name: "Umbra eSports Division",
    short: "UED",
    text: "Competitive play, eSports events, continued practice, and skill development.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-red-950 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(185,28,28,0.35),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <a href="/" className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black">
                <img src="/logo.png" alt="Umbra Logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
                  Corporation
                </p>
              </div>
            </a>

            <nav className="flex flex-wrap gap-4 text-sm font-bold text-zinc-300">
              <a href="#about" className="hover:text-red-400">About</a>
              <a href="#leadership" className="hover:text-red-400">Leadership</a>
              <a href="#history" className="hover:text-red-400">History</a>
              <a href="#manifesto" className="hover:text-red-400">Manifesto</a>
              <a href="#charter" className="hover:text-red-400">Charter</a>
              <a href="/fleet" className="hover:text-red-400">Org Fleet</a>
              <a href="/my-fleet" className="hover:text-red-400">My Fleet</a>
              <a href="/request-access" className="hover:text-red-400">Request Access</a>
              <a href="/admin" className="hover:text-red-400">Admin</a>
              <a href="/login" className="hover:text-red-400">Login</a>
            </nav>
          </header>

          <div className="grid gap-12 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="mb-6 inline-block rounded-full border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                RSI Designation: UCOR
              </p>

              <h1 className="text-6xl font-black leading-tight md:text-7xl">
                Victory from the shadows.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                Umbra Corporation is a private interstellar enterprise operating across commerce,
                intelligence, security, logistics, and strategic influence.
              </p>

              <p className="mt-5 text-xl font-bold italic text-red-400">
                Victoria ex Umbra
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a href="/fleet" className="rounded-2xl bg-red-700 px-8 py-4 font-black hover:bg-red-600">
                  View Org Fleet
                </a>
                <a href="/request-access" className="rounded-2xl border border-red-800 bg-black/50 px-8 py-4 font-black hover:bg-red-950/30">
                  Request Access
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-red-900 bg-black/60 p-8 shadow-2xl shadow-red-950/30">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950 p-10 text-center">
                <img src="/logo.png" alt="Umbra Logo" className="mx-auto h-40 w-40 object-contain" />
                <p className="mt-8 text-4xl font-black tracking-[0.35em]">UCOR</p>
                <p className="mt-3 text-xs uppercase tracking-[0.35em] text-zinc-400">
                  Umbra Corporation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          About
        </p>
        <h2 className="mt-4 text-4xl font-black md:text-5xl">
          Built in shadow. Directed by purpose.
        </h2>
        <p className="mt-6 max-w-4xl leading-8 text-zinc-300">
          Umbra Corporation is an autonomous, self-governing organization built around secrecy,
          profit, unity, and strategic control. Our members operate across specialized divisions
          to secure resources, gather intelligence, enforce corporate interests, and compete at
          the highest level.
        </p>
      </section>

      {/* LEADERSHIP */}
      <section id="leadership" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Board of Directors
          </p>
          <h2 className="mt-4 text-4xl font-black md:text-5xl">
            Leadership Roster
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {leadership.map((leader) => (
              <div key={leader.handle} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 hover:border-red-900">
                <p className="text-2xl font-black">{leader.handle}</p>
                <p className="mt-2 text-red-400">{leader.title}</p>
                <p className="mt-3 text-sm text-zinc-500">{leader.division}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVISIONS */}
      <section id="divisions" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Divisions
        </p>
        <h2 className="mt-4 text-4xl font-black md:text-5xl">
          Operational branches.
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {divisions.map((division) => (
            <div key={division.short} className="rounded-3xl border border-zinc-800 bg-black/60 p-7 hover:border-red-900">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
                {division.short}
              </p>
              <h3 className="mt-4 text-2xl font-black">{division.name}</h3>
              <p className="mt-4 leading-7 text-zinc-400">{division.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORY */}
      <section id="history" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            History
          </p>
          <h2 className="mt-4 text-4xl font-black">Founding — 2955</h2>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 leading-8 text-zinc-300">
            <p>
              Umbra Corporation was founded in 2955, during one of the most turbulent economic
              periods of the mid-29th century. Growing tensions between corporate powers, rising
              pirate syndicates, and shifting UEE regulations left vast portions of the frontier
              under-served, unprotected, and ungoverned.
            </p>
            <p className="mt-5">
              Where most saw chaos, a small coalition of industrialists, analysts, and security
              consultants saw opportunity.
            </p>
            <p className="mt-5">
              Operating initially from a series of clandestine offices in the Stanton system,
              Umbra began as a grey ops assault team specializing in covert operations,
              ungentlemanly warfare, and tactical reconnaissance. These early operations formed
              the backbone of what would eventually become the Umbra Corporation.
            </p>
            <p className="mt-5">
              Though small, the organization quickly gained a reputation for precision,
              discretion, and results—qualities that would define its corporate evolution.
            </p>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section id="manifesto" className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Manifesto
        </p>
        <h2 className="mt-4 text-4xl font-black">Victoria ex Umbra</h2>

        <div className="mt-8 space-y-6 rounded-3xl border border-zinc-800 bg-black/60 p-8 leading-8 text-zinc-300">
          <ManifestoSection title="I. Our Origin">
            Born in the void between stars, Umbra Corporation was not built on ideals — it was
            built on necessity. Where empires falter and bureaucracies drown in their own weight,
            Umbra thrives. We are the unseen architects of progress — the silent hand behind
            innovation, intelligence, and influence across the Stanton and Pyro systems. We do not
            beg the universe for order. We create it.
          </ManifestoSection>

          <ManifestoSection title="II. Our Vision">
            To command the frontier from the shadows. To own the unknown. To control the flow of
            information, resources, and power across every system we touch. Umbra Corporation
            exists to shape the future, not to chase it. We are not bound by law, nor chaos —
            only results.
          </ManifestoSection>

          <ManifestoSection title="III. Our Structure">
            Umbra operates through divisions, each serving a vital function in the corporate
            machine: ULD handles resource extraction, transport, and trade. USD provides
            protection, enforcement, and covert strike capabilities. UIN handles data acquisition,
            espionage, reconnaissance, and technological development. UED competes in eSports
            matches and refines competitive skill.
          </ManifestoSection>

          <ManifestoSection title="IV. Our Code">
            Secrecy is Strength. Profit is Power. Unity in Shadow. Adapt. Endure. Overcome. The
            void rewards only those who evolve.
          </ManifestoSection>

          <ManifestoSection title="V. Our Enemies">
            We have no enemies — only assets not yet acquired. Umbra does not wage war for
            vengeance or pride — only for control.
          </ManifestoSection>

          <ManifestoSection title="VI. Our Future">
            The universe grows darker with every cycle. Good. In that darkness, Umbra sees
            opportunity. The future belongs to those who own the shadows. The future belongs to
            the Umbra Corporation.
          </ManifestoSection>
        </div>
      </section>

      {/* CHARTER */}
      <section id="charter" className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Charter
          </p>
          <h2 className="mt-4 text-4xl font-black">
            Umbra Corporation Charter
          </h2>
          <p className="mt-3 text-red-400 italic">Victoria ex Umbra</p>

          <div className="mt-8 space-y-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 leading-8 text-zinc-300">
            <CharterArticle title="Article I — Name and Nature">
              Umbra Corporation is a private interstellar enterprise operating across the United
              Empire of Earth and beyond, specializing in commerce, intelligence, security, and
              strategic influence. Umbra is autonomous, self-governing, and answerable only to its
              own leadership.
            </CharterArticle>

            <CharterArticle title="Article II — Purpose and Objectives">
              Umbra exists to secure and expand influence, acquire high-value assets, provide
              corporate security, ensure member advancement, and shape the galactic balance of
              power by any means deemed efficient and necessary.
            </CharterArticle>

            <CharterArticle title="Article III — Organizational Structure">
              Umbra is divided into primary divisions under the authority of the Board of
              Directors: ULD, USD, UIN, UED, and the Board of Directors itself.
            </CharterArticle>

            <CharterArticle title="Article IV — Membership and Conduct">
              Members must demonstrate loyalty, discretion, and capability. Promotions are earned
              through results, loyalty, initiative, and operational success.
            </CharterArticle>

            <CharterArticle title="Article V — Authority and Enforcement">
              The Board of Directors holds ultimate authority. Division Commanders enforce
              directives, and violations are subject to review by Council Tribunal.
            </CharterArticle>

            <CharterArticle title="Article VI — Assets and Operations">
              Members may operate independently for profit, provided their actions benefit
              Umbra’s strategic or economic goals.
            </CharterArticle>

            <CharterArticle title="Article VII — Secrecy and Security">
              All intelligence, communications, and operational data are classified under Umbra
              Protocol Black. The shadow protects us all.
            </CharterArticle>

            <CharterArticle title="Article VIII — Amendments and Succession">
              Amendments require unanimous consent of the Board of Directors. Leadership
              transition follows Directive Eclipse.
            </CharterArticle>

            <CharterArticle title="Article IX — Declaration">
              By joining Umbra Corporation, each member affirms their commitment to serve the
              Corporation’s interests, uphold secrecy, and advance the cause of Umbra wherever
              the stars may lead.
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

function ManifestoSection({ title, children }) {
  return (
    <section>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mt-3">{children}</p>
    </section>
  );
}

function CharterArticle({ title, children }) {
  return (
    <section>
      <h3 className="text-2xl font-black text-white">{title}</h3>
      <p className="mt-3">{children}</p>
    </section>
  );
}