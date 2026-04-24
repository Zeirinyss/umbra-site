"use client";

import React, { useMemo, useState } from "react";

const divisions = [
  "Security Operations",
  "Racing Division",
  "Logistics & Fleet",
  "Recruitment & Training",
];

const divisionCards = [
  {
    title: "Security Operations",
    tag: "Protection / Combat Support",
    text: "Escort operations, asset protection, tactical support, and defensive readiness for Umbra contracts.",
  },
  {
    title: "Racing Division",
    tag: "Speed / Competition",
    text: "Organized racing, pilot training, championship events, and high-speed performance development.",
  },
  {
    title: "Logistics & Fleet",
    tag: "Hauling / Support",
    text: "Transport, recovery, refueling support, cargo movement, and operational fleet coordination.",
  },
  {
    title: "Recruitment & Training",
    tag: "Growth / Standards",
    text: "Onboarding, training classes, member development, and maintaining organization standards.",
  },
];

const roster = [
  { name: "Commander Vaunn", handle: "Vaunn", rank: "Command", division: "Security Operations", status: "Active" },
  { name: "Kon", handle: "Kon", rank: "Officer", division: "Recruitment & Training", status: "Active" },
  { name: "Zero", handle: "Zero", rank: "Member", division: "Logistics & Fleet", status: "Active" },
  { name: "Razor Lead", handle: "UCOR_Razor", rank: "Race Captain", division: "Racing Division", status: "Active" },
];

export default function Home() {
  const [selectedDivision, setSelectedDivision] = useState("All Divisions");
  const [applications, setApplications] = useState([]);

  const [form, setForm] = useState({
    name: "",
    handle: "",
    discord: "",
    division: "Racing Division",
    experience: "New",
    reason: "",
  });

  const filteredRoster = useMemo(() => {
    if (selectedDivision === "All Divisions") return roster;
    return roster.filter((member) => member.division === selectedDivision);
  }, [selectedDivision]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitApplication(event) {
    event.preventDefault();
    setApplications([{ ...form, status: "Pending Review" }, ...applications]);
    setForm({
      name: "",
      handle: "",
      discord: "",
      division: "Racing Division",
      experience: "New",
      reason: "",
    });
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-red-950/70 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_15%,rgba(185,28,28,0.38),transparent_35%),linear-gradient(135deg,rgba(127,29,29,0.28),transparent_45%)]" />
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:70px_70px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-7">
          <header className="flex items-center justify-between gap-6">
            <a href="#top" className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-700/80 bg-black/70 shadow-lg shadow-red-950/40">
                <img src="/logo.png" alt="Umbra Corporation logo" className="h-10 w-10 object-contain" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">Corporation</p>
              </div>
            </a>

            <nav className="hidden items-center gap-8 text-sm font-semibold text-zinc-300 md:flex">
              <a href="#about" className="hover:text-red-400">About</a>
              <a href="#divisions" className="hover:text-red-400">Divisions</a>
              <a href="#roster" className="hover:text-red-400">Roster</a>
              <a href="#apply" className="hover:text-red-400">Apply</a>
            </nav>

            <a href="#apply" className="rounded-2xl bg-red-700 px-6 py-3 text-sm font-black shadow-lg shadow-red-950/40 hover:bg-red-600">
              Apply
            </a>
          </header>

          <div id="top" className="grid gap-14 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              <p className="mb-6 inline-flex rounded-full border border-red-900 bg-red-950/35 px-4 py-2 text-sm text-red-200">
                RSI Designation: UCOR
              </p>

              <h1 className="max-w-3xl text-6xl font-black leading-[1.02] tracking-tight md:text-7xl">
                Victory from the shadows.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300">
                Umbra Corporation is a Star Citizen organization built around loyalty, discipline, and strength in silence. We operate across security, racing, logistics, and member training.
              </p>

              <p className="mt-6 text-xl font-bold italic text-red-400">Victoria ex Umbra</p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a href="#apply" className="rounded-2xl bg-red-700 px-8 py-4 font-black shadow-lg shadow-red-950/40 hover:bg-red-600">
                  Start Application
                </a>
                <a href="#roster" className="rounded-2xl border border-red-800 bg-black/50 px-8 py-4 font-black hover:bg-red-950/30">
                  View Roster
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-[2rem] border border-red-900/80 bg-black/60 p-8 shadow-2xl shadow-red-950/30 backdrop-blur">
              <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/90 p-10 text-center">
                <div className="mx-auto grid h-40 w-40 place-items-center rounded-full border-2 border-red-700 bg-black shadow-lg shadow-red-950/50">
                  <img src="/logo.png" alt="Umbra Corporation logo" className="h-28 w-28 object-contain" />
                </div>
                <p className="mt-8 text-4xl font-black tracking-[0.35em]">UCOR</p>
                <p className="mt-3 text-xs uppercase tracking-[0.35em] text-zinc-400">Umbra Corporation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">About UCOR</p>
            <h2 className="mt-4 text-4xl font-black md:text-5xl">A corporation forged in shadow.</h2>
          </div>
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/40 p-8 leading-8 text-zinc-300">
            <p>
              Umbra Corporation is built for pilots who want structure without losing the fun of flying together. Our members work together through organized operations, racing events, fleet support, and training programs.
            </p>
            <p className="mt-5">
              We value loyalty, respect, teamwork, and readiness. Whether you are a combat pilot, racer, hauler, scout, or new recruit, UCOR gives you a place to grow and contribute.
            </p>
          </div>
        </div>
      </section>

      <section id="divisions" className="border-y border-zinc-900 bg-black/45 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Divisions</p>
          <h2 className="mt-4 text-4xl font-black md:text-5xl">Operational branches.</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {divisionCards.map((division) => (
              <div key={division.title} className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-7 shadow-xl shadow-black/30 transition hover:border-red-800 hover:bg-red-950/10">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">{division.tag}</p>
                <h3 className="mt-4 text-2xl font-black">{division.title}</h3>
                <p className="mt-4 leading-7 text-zinc-400">{division.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roster" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Roster</p>
            <h2 className="mt-4 text-4xl font-black md:text-5xl">Division member listing.</h2>
          </div>

          <select
            className="rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-zinc-100 outline-none focus:border-red-700"
            value={selectedDivision}
            onChange={(event) => setSelectedDivision(event.target.value)}
          >
            <option>All Divisions</option>
            {divisions.map((division) => <option key={division}>{division}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-[2rem] border border-zinc-800 bg-zinc-950/80">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-red-950/35 text-xs uppercase tracking-[0.2em] text-red-300">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">RSI Handle</th>
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Division</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((member) => (
                <tr key={`${member.handle}-${member.division}`} className="border-t border-zinc-900 text-zinc-300">
                  <td className="px-5 py-4 font-bold text-white">{member.name}</td>
                  <td className="px-5 py-4">{member.handle}</td>
                  <td className="px-5 py-4">{member.rank}</td>
                  <td className="px-5 py-4">{member.division}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-red-950/60 px-3 py-1 text-xs text-red-200">{member.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="apply" className="border-t border-zinc-900 bg-black/40 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-red-950/80 bg-zinc-950 p-8 shadow-2xl shadow-red-950/20">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Application</p>
            <h2 className="mt-4 text-4xl font-black">Join Umbra Corporation</h2>

            <form onSubmit={submitApplication} className="mt-8 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input placeholder="Name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700" required />
                <input placeholder="RSI Handle" value={form.handle} onChange={(event) => updateForm("handle", event.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700" required />
              </div>

              <input placeholder="Discord Username" value={form.discord} onChange={(event) => updateForm("discord", event.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700" required />

              <div className="grid gap-4 md:grid-cols-2">
                <select value={form.division} onChange={(event) => updateForm("division", event.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700">
                  {divisions.map((division) => <option key={division}>{division}</option>)}
                </select>

                <select value={form.experience} onChange={(event) => updateForm("experience", event.target.value)} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700">
                  <option>New</option>
                  <option>Casual</option>
                  <option>Intermediate</option>
                  <option>Experienced</option>
                  <option>Veteran</option>
                </select>
              </div>

              <textarea placeholder="Why do you want to join UCOR?" value={form.reason} onChange={(event) => updateForm("reason", event.target.value)} className="min-h-32 rounded-2xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-red-700" required />

              <button type="submit" className="rounded-2xl bg-red-700 px-7 py-4 font-black shadow-lg shadow-red-950/40 hover:bg-red-600">
                Submit Application
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/80 p-8">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Command View</p>
            <h2 className="mt-4 text-4xl font-black">Applications</h2>

            <div className="mt-8 grid gap-4">
              {applications.length === 0 && (
                <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
                  No applications submitted yet.
                </p>
              )}

              {applications.map((application, index) => (
                <div key={`${application.handle}-${index}`} className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black">{application.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{application.handle} • {application.discord}</p>
                    </div>
                    <span className="rounded-full bg-red-950/60 px-3 py-1 text-xs text-red-200">{application.status}</span>
                  </div>
                  <p className="mt-4 text-sm text-zinc-300"><b>Division:</b> {application.division}</p>
                  <p className="mt-2 text-sm text-zinc-300"><b>Experience:</b> {application.experience}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{application.reason}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 rounded-2xl border border-red-950 bg-red-950/20 p-4 text-sm leading-6 text-zinc-300">
              Current demo: applications show here while the page is open. Later we can connect this to Google Sheets or Supabase so applications save permanently.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8 text-center text-sm text-zinc-500">
        © 2954 Umbra Corporation / UCOR. Victoria ex Umbra.
      </footer>
    </main>
  );
}
