"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const QUALITY_FILTERS = [
  { label: "All Qualities", value: 0 },
  { label: "500+", value: 500 },
  { label: "600+", value: 600 },
  { label: "700+", value: 700 },
  { label: "800+", value: 800 },
  { label: "900+", value: 900 },
  { label: "950+", value: 950 },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [materialName, setMaterialName] = useState("");
  const [qualityValue, setQualityValue] = useState("");
  const [scuAmount, setScuAmount] = useState("");
  const [qualityFilter, setQualityFilter] = useState(0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    loadMaterials();

    const channel = supabase
      .channel("org-materials-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_materials" },
        () => loadMaterials()
      )
      .subscribe();

    const refreshTimer = setInterval(loadMaterials, 3000);

    return () => {
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMaterials() {
    const { data, error } = await supabase
      .from("org_materials")
      .select("*")
      .order("material_name", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Failed to load materials.");
      return;
    }

    setMaterials(data || []);
    setMessage("");
  }

  async function addMaterial(e) {
    e.preventDefault();

    const cleanName = materialName.trim();
    const quality = Number(qualityValue);
    const scu = Number(scuAmount);

    if (!cleanName) return setMessage("Enter a material name.");
    if (!quality || quality < 1 || quality > 999) return setMessage("Enter quality from 1 to 999.");
    if (!scu || scu <= 0) return setMessage("Enter SCU amount.");

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) return setMessage("You must be logged in.");

    const { data: member } = await supabase
      .from("members")
      .select("rsi_handle")
      .eq("email", user.email)
      .maybeSingle();

    const displayName = member?.rsi_handle || user.email;

    const { error } = await supabase.from("org_materials").insert({
      user_id: user.id,
      rsi_handle: displayName,
      material_name: cleanName,
      quality_value: quality,
      scu_amount: scu,
      quality_tier: `${quality}+`,
    });

    if (error) {
      console.error(error);
      setMessage("Failed to add material.");
      return;
    }

    setMaterialName("");
    setQualityValue("");
    setScuAmount("");
    setMessage("");
    loadMaterials();
  }

  const groupedMaterials = useMemo(() => {
    const filtered = materials.filter((item) => {
      const nameMatch = item.material_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const quality = Number(item.quality_value || 0);

      return nameMatch && quality >= Number(qualityFilter);
    });

    const grouped = {};

    for (const item of filtered) {
      const name = item.material_name || "Unknown Material";
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(item);
    }

    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        totalScu: grouped[name].reduce(
          (sum, item) => sum + Number(item.scu_amount || 0),
          0
        ),
        entries: grouped[name].sort(
          (a, b) => Number(b.quality_value || 0) - Number(a.quality_value || 0)
        ),
      }));
  }, [materials, search, qualityFilter]);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl border border-red-950 bg-gradient-to-br from-black via-zinc-950 to-red-950/20 p-6 shadow-2xl shadow-red-950/30">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-red-500">
            Umbra Logistics
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Materials Inventory
          </h1>

          <p className="mt-3 max-w-3xl text-zinc-400">
            Track exact material quality and SCU by member. Search by material,
            filter by quality, and see who has what at a glance.
          </p>
        </section>

        <form
          onSubmit={addMaterial}
          className="mt-6 rounded-3xl border border-zinc-800 bg-black/80 p-5 shadow-xl"
        >
          <h2 className="text-2xl font-black">Add Inventory</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_160px_140px]">
            <input
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Material name, ex: Iron"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-red-700"
            />

            <input
              type="number"
              value={qualityValue}
              onChange={(e) => setQualityValue(e.target.value)}
              placeholder="Quality 999"
              min="1"
              max="999"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-red-700"
            />

            <input
              type="number"
              value={scuAmount}
              onChange={(e) => setScuAmount(e.target.value)}
              placeholder="SCU 100"
              min="0"
              step="0.01"
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-red-700"
            />

            <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
              Add
            </button>
          </div>

          {message && (
            <p className="mt-3 text-sm font-bold text-red-400">{message}</p>
          )}
        </form>

        <section className="mt-6 rounded-3xl border border-zinc-800 bg-black/80 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search material..."
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-red-700"
            />

            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(Number(e.target.value))}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none focus:border-red-700"
            >
              {QUALITY_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {groupedMaterials.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-black p-5 text-zinc-400">
              No materials match this filter.
            </div>
          )}

          {groupedMaterials.map((material) => (
            <div
              key={material.name}
              className="overflow-hidden rounded-3xl border border-zinc-800 bg-black shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 p-5">
                <div>
                  <h3 className="text-3xl font-black text-red-400">
                    {material.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {material.entries.length} entry
                    {material.entries.length !== 1 ? "ies" : ""} ·{" "}
                    {material.totalScu} total SCU
                  </p>
                </div>
              </div>

              <div className="grid gap-3 p-4">
                {material.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:grid-cols-[1fr_120px_120px]"
                  >
                    <div>
                      <p className="font-black">
                        {entry.rsi_handle || "Member"}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Inventory holder
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-center">
                      <p className="text-xs font-bold uppercase text-red-300">
                        Quality
                      </p>
                      <p className="text-2xl font-black">
                        {entry.quality_value || "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-700 bg-black p-3 text-center">
                      <p className="text-xs font-bold uppercase text-zinc-400">
                        SCU
                      </p>
                      <p className="text-2xl font-black">
                        {entry.scu_amount || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}