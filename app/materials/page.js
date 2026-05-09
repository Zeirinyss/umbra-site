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

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [materialName, setMaterialName] = useState("");
  const [qualityTier, setQualityTier] = useState("Over 500");
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    loadMaterials();

    const channel = supabase
      .channel("org-materials-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "org_materials" },
        () => {
          loadMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMaterials() {
    const { data, error } = await supabase
      .from("org_materials")
      .select("*")
      .order("material_name", { ascending: true })
      .order("quality_tier", { ascending: true });

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

  const groupedMaterials = useMemo(() => {
    const grouped = {};

    for (const item of materials) {
      const name = item.material_name || "Unknown Material";

      if (!grouped[name]) {
        grouped[name] = {};
      }

      if (!grouped[name][item.quality_tier]) {
        grouped[name][item.quality_tier] = [];
      }

      grouped[name][item.quality_tier].push(item);
    }

    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        tiers: grouped[name],
      }));
  }, [materials]);

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-black">Org Materials</h1>
        <p className="mt-2 text-zinc-400">
          Track what materials members have, grouped by material and quality.
        </p>

        <form
          onSubmit={addMaterial}
          className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4"
        >
          <h2 className="mb-4 text-xl font-black">Add Material</h2>

          <input
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            placeholder="Material name..."
            className="mb-4 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 outline-none"
          />

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            {QUALITY_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setQualityTier(tier)}
                className={`rounded-xl border p-3 text-sm font-bold ${
                  qualityTier === tier
                    ? "border-red-600 bg-red-700 text-white"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <button className="mt-4 w-full rounded-xl bg-red-700 p-3 font-black">
            Add Material
          </button>

          {message && (
            <p className="mt-3 text-center text-sm text-red-400">{message}</p>
          )}
        </form>

        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black">Material Inventory</h2>

          {groupedMaterials.length === 0 && !message && (
            <div className="rounded-xl border border-zinc-800 bg-black p-4 text-zinc-400">
              No materials added yet.
            </div>
          )}

          <div className="grid gap-4">
            {groupedMaterials.map((material) => (
              <div
                key={material.name}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <h3 className="text-2xl font-black text-red-400">
                  {material.name}
                </h3>

                <div className="mt-4 grid gap-3">
                  {QUALITY_TIERS.map((tier) => {
                    const entries = material.tiers[tier] || [];

                    if (entries.length === 0) return null;

                    return (
                      <div
                        key={tier}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                      >
                        <p className="font-bold text-zinc-200">{tier}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {entries.map((entry) => (
                            <span
                              key={entry.id}
                              className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                            >
                              {entry.rsi_handle || "Member"}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}