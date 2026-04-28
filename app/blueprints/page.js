"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [qualities, setQualities] = useState({});

  useEffect(() => {
    loadBlueprints();
  }, []);

  async function loadBlueprints() {
    const { data } = await supabase.from("blueprints").select("*");
    setBlueprints(data || []);
  }

  async function loadMaterials(bpId) {
    const { data } = await supabase
      .from("blueprint_materials")
      .select("*")
      .eq("blueprint_id", bpId);

    setMaterials(data || []);

    const initial = {};
    data.forEach((m) => {
      initial[m.id] = 500;
    });
    setQualities(initial);
  }

  function updateQuality(id, value) {
    setQualities((prev) => ({
      ...prev,
      [id]: Number(value),
    }));
  }

  function getFinalQuality() {
    const values = Object.values(qualities);
    if (values.length === 0) return 0;
    return Math.round(
      values.reduce((sum, v) => sum + v, 0) / values.length
    );
  }

  // GROUP MATERIALS BY PART
  const grouped = materials.reduce((acc, mat) => {
    if (!acc[mat.part]) acc[mat.part] = [];
    acc[mat.part].push(mat);
    return acc;
  }, {});

  // BASE STATS
  const BASE_STATS = {
    "Killshot Rifle": {
      recoil_smoothness: 0,
      recoil_handling: 0,
      recoil_kick: 0,
      impact_force: 1,
      fire_rate: 600,
    },
    "Karna Rifle": {
      recoil_smoothness: 0,
      recoil_handling: 0,
      recoil_kick: 0,
      impact_force: 1,
      fire_rate: 600,
    },
  };

  function getCraftedStats() {
    if (!selected) return null;

    const base = BASE_STATS[selected.name];
    if (!base) return null;

    const qualityFactor = getFinalQuality() / 1000;

    return {
      recoil_smoothness: Math.round(base.recoil_smoothness + qualityFactor * 10),
      recoil_handling: Math.round(base.recoil_handling + qualityFactor * 10),
      recoil_kick: Math.round(base.recoil_kick + qualityFactor * 10),
      impact_force: +(base.impact_force * (1 + qualityFactor * 0.2)).toFixed(2),
      fire_rate: Math.round(base.fire_rate * (1 + qualityFactor * 0.1)),
    };
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[300px_1fr] gap-6">

        {/* LEFT PANEL */}
        <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6">
          <h2 className="text-2xl font-black mb-4">Blueprints</h2>

          <div className="space-y-2">
            {blueprints.map((bp) => (
              <button
                key={bp.id}
                onClick={() => {
                  setSelected(bp);
                  loadMaterials(bp.id);
                }}
                className="w-full text-left p-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition"
              >
                <p className="font-bold">{bp.name}</p>
                <p className="text-xs text-zinc-500">{bp.category}</p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="rounded-3xl border border-red-900 bg-black/70 p-6 shadow-2xl shadow-red-950/20">

          {!selected ? (
            <p className="text-zinc-500">Select a blueprint</p>
          ) : (
            <>
              {/* HEADER */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black">{selected.name}</h2>
                  <p className="text-sm text-zinc-500">{selected.category}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase text-zinc-500">Quality</p>
                  <p className="text-2xl font-black text-yellow-400">
                    {getFinalQuality()}
                  </p>
                </div>
              </div>

              {/* PARTS */}
              <div className="space-y-4">
                {Object.keys(grouped).map((part) => (
                  <div
                    key={part}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                  >
                    <p className="text-sm font-black tracking-wider text-zinc-300 mb-3">
                      {part.toUpperCase()}
                    </p>

                    {grouped[part].map((mat) => (
                      <div key={mat.id} className="space-y-2 mb-3">

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-400 font-semibold">
                            {mat.material_name}
                          </span>
                          <span className="text-zinc-500">
                            {mat.scu} SCU
                          </span>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="999"
                          value={qualities[mat.id] || 500}
                          onChange={(e) =>
                            updateQuality(mat.id, e.target.value)
                          }
                          className="w-full appearance-none h-1 bg-zinc-800 rounded-lg
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:w-4
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-red-500
                          [&::-webkit-slider-thumb]:shadow-lg"
                        />

                        <div className="text-right text-xs text-yellow-400">
                          {qualities[mat.id] || 500}
                        </div>

                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* STATS PANEL */}
              <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/50 p-4">

                <h3 className="text-lg font-black mb-4">Stats</h3>

                <div className="grid grid-cols-2 text-sm gap-y-2">

                  <div className="text-zinc-500">Stat</div>
                  <div className="text-zinc-500 text-right">Crafted</div>

                  {Object.entries(getCraftedStats() || {}).map(([key, value]) => (
                    <div key={key} className="contents">
                      <div className="capitalize text-zinc-300">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-right text-yellow-400 font-semibold">
                        {value}
                      </div>
                    </div>
                  ))}

                </div>

              </div>
            </>
          )}

        </div>
      </div>
    </main>
  );
}