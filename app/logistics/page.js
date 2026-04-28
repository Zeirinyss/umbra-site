"use client";

import { useState } from "react";

export default function LogisticsPage() {
  const [mode, setMode] = useState("Hauling");

  const [scu, setScu] = useState(0);
  const [crew, setCrew] = useState(1);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [cargo, setCargo] = useState("");

  // mining only
  const [purity, setPurity] = useState(50);
  const [ore, setOre] = useState("Quantanium");

  const ORE_PRICES = {
    Quantanium: 27000,
    Taranite: 8000,
    Bexalite: 6000,
    Laranite: 5000,
    Agricium: 4000,
  };

  function getShipRecommendation() {
    if (mode === "Hauling") {
      if (scu <= 100) return "Cutlass / Freelancer";
      if (scu <= 300) return "Freelancer MAX / Taurus";
      if (scu <= 700) return "Caterpillar";
      return "C2 Hercules";
    }

    if (mode === "Mining") {
      return crew > 1 ? "MOLE" : "Prospector";
    }

    if (mode === "Salvage") {
      return crew > 2 ? "Reclaimer" : "Vulture";
    }

    return "N/A";
  }

  function getTrips() {
    if (mode !== "Hauling") return "N/A";
    let cap = 100;
    if (scu > 300) cap = 300;
    if (scu > 700) cap = 700;
    return Math.max(1, Math.ceil(scu / cap));
  }

  function getEscort() {
    if (mode === "Hauling") return scu > 300 ? "Recommended" : "Optional";
    if (mode === "Mining") return "Optional";
    if (mode === "Salvage") return "Recommended";
    return "N/A";
  }

  function getSplit() {
    if (!crew || crew <= 0) return "N/A";
    return `${(100 / crew).toFixed(1)}% each`;
  }

  function getMiningValue() {
    if (mode !== "Mining") return null;
    const price = ORE_PRICES[ore] || 0;
    return Math.round(scu * (purity / 100) * price);
  }

  function copyPlan() {
    const text = `📦 UCOR Operation Plan
Type: ${mode}
Pickup: ${pickup}
Drop-off: ${dropoff}
Cargo: ${cargo}
SCU: ${scu}
Crew: ${crew}

Ship: ${getShipRecommendation()}
Trips: ${getTrips()}
Escort: ${getEscort()}
Split: ${getSplit()}
${
  mode === "Mining"
    ? `Estimated Value: ${getMiningValue()} aUEC`
    : ""
}`;

    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black">Operations Planner</h1>
          <p className="text-zinc-400">
            Plan mining, hauling, and salvage operations
          </p>
        </div>

        {/* MODE */}
        <div className="flex gap-3 mb-6">
          {["Hauling", "Mining", "Salvage"].map((type) => (
            <button
              key={type}
              onClick={() => setMode(type)}
              className={`px-4 py-2 rounded-xl font-bold ${
                mode === type
                  ? "bg-red-700"
                  : "border border-zinc-800 hover:bg-zinc-900"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">

          {/* INPUT */}
          <div className="rounded-2xl border border-zinc-800 bg-black/60 p-5 space-y-4">

            <input
              placeholder="Pickup Location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800"
            />

            <input
              placeholder="Drop-off Location"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800"
            />

            <input
              placeholder="Cargo / Resource"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="SCU"
                value={scu}
                onChange={(e) => setScu(Number(e.target.value))}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800"
              />

              <input
                type="number"
                placeholder="Crew"
                value={crew}
                onChange={(e) => setCrew(Number(e.target.value))}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800"
              />
            </div>

            {/* MINING ONLY */}
            {mode === "Mining" && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">

                <select
                  value={ore}
                  onChange={(e) => setOre(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800"
                >
                  {Object.keys(ORE_PRICES).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>

                <div>
                  <p className="text-sm text-zinc-400 mb-1">
                    Purity: {purity}%
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={purity}
                    onChange={(e) => setPurity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

              </div>
            )}

          </div>

          {/* OUTPUT */}
          <div className="rounded-2xl border border-red-900 bg-black/60 p-5 space-y-4">

            <Result label="Ship" value={getShipRecommendation()} />
            <Result label="Trips" value={getTrips()} />
            <Result label="Escort" value={getEscort()} />
            <Result label="Split" value={getSplit()} />

            {mode === "Mining" && (
              <Result
                label="Estimated Value"
                value={`${getMiningValue()} aUEC`}
              />
            )}

            <button
              onClick={copyPlan}
              className="w-full mt-4 bg-red-700 py-3 rounded-xl font-black"
            >
              Copy Plan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Result({ label, value }) {
  return (
    <div className="flex justify-between border-b border-zinc-800 pb-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}