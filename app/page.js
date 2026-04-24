"use client";

import React, { useMemo, useState } from "react";

const divisions = [
  "Security Operations",
  "Racing Division",
  "Logistics & Fleet",
  "Recruitment & Training",
];

const roster = [
  { name: "Commander Vaunn", handle: "Vaunn", division: "Security Operations" },
  { name: "Kon", handle: "Kon", division: "Recruitment & Training" },
  { name: "Zero", handle: "Zero", division: "Logistics & Fleet" },
];

export default function Home() {
  const [selectedDivision, setSelectedDivision] = useState("All Divisions");
  const [applications, setApplications] = useState([]);

  const [form, setForm] = useState({
    name: "",
    handle: "",
    discord: "",
    division: "Racing Division",
    reason: "",
  });

  const filteredRoster = useMemo(() => {
    if (selectedDivision === "All Divisions") return roster;
    return roster.filter((m) => m.division === selectedDivision);
  }, [selectedDivision]);

  function updateForm(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submitApplication(e) {
    e.preventDefault();
    setApplications([{ ...form }, ...applications]);
    setForm({ name: "", handle: "", discord: "", division: "Racing Division", reason: "" });
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO */}
      <section className="px-6 py-20 border-b border-red-900/30 bg-gradient-to-b from-red-950/40 to-black">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">

          <div>
            <div className="flex items-center gap-4 mb-6">
              <img src="/logo.png" className="h-14 w-14" />
              <div>
                <h1 className="text-3xl font-bold tracking-wide">UMBRA</h1>
                <p className="text-red-400 text-sm tracking-widest">CORPORATION</p>
              </div>
            </div>

            <h2 className="text-5xl font-black leading-tight mb-6">
              Victory from the shadows.
            </h2>

            <p className="text-gray-300 max-w-xl mb-6">
              Umbra Corporation is a disciplined Star Citizen organization built around loyalty,
              precision, and strength in silence.
            </p>

            <p className="text-red-400 italic mb-6">Victoria ex Umbra</p>

            <div className="flex gap-4">
              <a href="#apply" className="bg-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-500">Apply</a>
              <a href="#roster" className="border border-red-600 px-6 py-3 rounded-lg hover:bg-red-900/20">Roster</a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="border border-red-900 rounded-2xl p-10 bg-black/60 shadow-lg">
              <img src="/logo.png" className="h-40 w-40 mx-auto" />
              <p className="text-center mt-4 text-gray-400">UCOR</p>
            </div>
          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">About</h2>
        <p className="text-gray-300 max-w-2xl">
          Umbra Corporation operates across multiple divisions to dominate every aspect of the verse.
          From combat operations to racing and logistics, we build disciplined pilots.
        </p>
      </section>

      {/* ROSTER */}
      <section id="roster" className="px-6 py-16 bg-black/40 border-y border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Roster</h2>

          <select
            className="mb-6 bg-black border border-zinc-700 p-3 rounded-lg"
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
          >
            <option>All Divisions</option>
            {divisions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <div className="space-y-3">
            {filteredRoster.map((m) => (
              <div key={m.handle} className="border border-zinc-800 p-4 rounded-lg bg-zinc-900/40 hover:border-red-700">
                {m.name} ({m.handle}) - {m.division}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY */}
      <section id="apply" className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Apply</h2>

        <form onSubmit={submitApplication} className="grid gap-4 max-w-md">
          <input placeholder="Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="p-3 bg-black border border-zinc-700 rounded-lg" required />
          <input placeholder="RSI Handle" value={form.handle} onChange={(e) => updateForm("handle", e.target.value)} className="p-3 bg-black border border-zinc-700 rounded-lg" required />
          <input placeholder="Discord" value={form.discord} onChange={(e) => updateForm("discord", e.target.value)} className="p-3 bg-black border border-zinc-700 rounded-lg" required />

          <select value={form.division} onChange={(e) => updateForm("division", e.target.value)} className="p-3 bg-black border border-zinc-700 rounded-lg">
            {divisions.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <textarea placeholder="Why do you want to join?" value={form.reason} onChange={(e) => updateForm("reason", e.target.value)} className="p-3 bg-black border border-zinc-700 rounded-lg" required />

          <button className="bg-red-600 p-3 rounded-lg font-bold hover:bg-red-500">Submit</button>
        </form>
      </section>

    </main>
  );
}
