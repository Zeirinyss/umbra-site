"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const QUALITY_TIERS = [
  "Less than 500",
  "Over 500",
  "Over 600",
  "Over 700",
  "Over 800",
  "Over 900",
];

const QUALITY_VALUES = {
  "Less than 500": 0,
  "Over 500": 500,
  "Over 600": 600,
  "Over 700": 700,
  "Over 800": 800,
  "Over 900": 900,
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [materialName, setMaterialName] = useState("");
  const [qualityTier, setQualityTier] = useState("Over 500");
  const [qualityFilter, setQualityFilter] = useState("All");
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

    const refreshTimer = setInterval(() => {
      loadMaterials();
    }, 3000);

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
      console.error("Failed to load materials:", error);
      setMessage("Failed to load materials.");
      return;
    }

    setMaterials(data || []);
    setMessage("");
  }

  async function addMaterial(e) {
    e.preventDefault();

    const cleanName = materialName.trim();

    if (!cleanName) {
      setMessage("Enter a material name.");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

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
      quality_tier: qualityTier,
    });

    if (error) {
      console.error("Failed to add material:", error);
      setMessage("Failed to add material.");
      return;
    }

    setMaterialName("");
    setQualityTier("Over 500");
    setMessage("");
    loadMaterials();
  }

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const nameMatch = item.material_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      if (!nameMatch) return false;

      if (qualityFilter === "All") return true;

      const itemValue = QUALITY_VALUES[item.quality_tier] ?? 0;
      const filterValue = QUALITY_VALUES[qualityFilter] ?? 0;

      return itemValue >= filterValue;
    });
  }, [materials, search, qualityFilter]);

  const groupedMaterials = useMemo(() => {
    const grouped = {};

    for (const item of filteredMaterials) {
      const name = item.material_name || "Unknown Material";

      if (!grouped[name]) {
        grouped[name] = [];
      }

      grouped[name].push(item);
    }

    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        entries: grouped[name].sort(
          (a, b) =>
            (QUALITY_VALUES[b.quality_tier] ?? 0) -
            (QUALITY_VALUES[a.quality_tier] ?? 0)
        ),
      }));
  }, [filteredMaterials]);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-red-950 bg-black p-6 shadow-2xl shadow-red-950/20">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">
            Umbra Logistics
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Org Materials Inventory
          </h1>

          <p className="mt-2 text-zinc-400">
            Track which members have materials and filter by quality range.
          </p>
        </div>

        <form
          onSubmit={addMaterial}
          className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4"
        >
          <h2 className="mb-4 text-xl font-black">Add Material</h2>

          <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
            <input
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Material name..."
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"
            />

            <select
              value={qualityTier}
              onChange={(e) => setQualityTier(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"
            >
              {QUALITY_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>

            <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
              Add
            </button>
          </div>

          {message && (
            <p className="mt-3 text-center text-sm text-red-400">
              {message}
            </p>
          )}
        </form>

        <section className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search material..."
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"
            />

            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"
            >
              <option value="All">Show all qualities</option>
              <option value="Over 500">500+</option>
              <option value="Over 600">600+</option>
              <option value="Over 700">700+</option>
              <option value="Over 800">800+</option>
              <option value="Over 900">900+</option>
            </select>
          </div>
        </section>

        <section className="mt-6">
          {groupedMaterials.length === 0 && !message && (
            <div className="rounded-xl border border-zinc-800 bg-black p-4 text-zinc-400">
              No materials match this filter.
            </div>
          )}

          <div className="grid gap-4">
            {groupedMaterials.map((material) => (
              <div
                key={material.name}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-2xl font-black text-red-400">
                    {material.name}
                  </h3>

                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300">
                    {material.entries.length} member
                    {material.entries.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mt-4 grid gap-2">
                  {material.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                    >
                      <p className="font-bold">
                        {entry.rsi_handle || "Member"}
                      </p>

                      <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-300">
                        {entry.quality_tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}