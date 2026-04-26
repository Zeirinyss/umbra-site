"use client";

import UserMenu from "@/components/UserMenu";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          About
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-6xl">
          Built in shadow. Directed by purpose.
        </h1>

        <div className="mt-10 rounded-3xl border border-zinc-800 bg-black/60 p-8 leading-8 text-zinc-300">
          <p>
            Umbra Corporation is an autonomous, self-governing organization built
            around secrecy, profit, unity, and strategic control. Members operate
            across specialized divisions to secure resources, gather intelligence,
            enforce corporate interests, and compete at the highest level.
          </p>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-black/40 py-20">
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

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
          Manifesto
        </p>

        <h2 className="mt-4 text-4xl font-black">Victoria ex Umbra</h2>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <InfoCard
            title="I. Our Origin"
            text="Born in the void between stars, Umbra was not built on ideals. It was built on necessity."
          />
          <InfoCard
            title="II. Our Vision"
            text="To command the frontier from the shadows and control the flow of information, resources, and power."
          />
          <InfoCard
            title="III. Our Structure"
            text="Umbra operates through dedicated divisions, each serving a vital role in the corporate machine."
          />
          <InfoCard
            title="IV. Our Code"
            text="Secrecy is Strength. Profit is Power. Unity in Shadow. Adapt. Endure. Overcome."
          />
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Charter
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Umbra Corporation Charter
          </h2>

          <p className="mt-3 text-red-400 italic">Victoria ex Umbra</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <InfoCard
              title="Article I — Name and Nature"
              text="Umbra Corporation is a private interstellar enterprise operating across the UEE and beyond."
            />
            <InfoCard
              title="Article II — Purpose"
              text="Umbra exists to expand influence, acquire assets, provide security, and ensure member advancement."
            />
            <InfoCard
              title="Article III — Structure"
              text="Umbra is divided into primary divisions under the authority of the Board of Directors."
            />
          </div>
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
            <img src="/logo.png" alt="Umbra Logo" className="h-10 w-10 object-contain" />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
              Corporation
            </p>
          </div>
        </a>

               <div className="rounded-2xl border border-zinc-900 bg-zinc-950/70 px-4 py-3 text-sm font-bold text-zinc-300">
          <UserMenu />
        </div>
      </div>
    </header>
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