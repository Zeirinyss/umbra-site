"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FleetPage() {
  const [ships, setShips] = useState([]);
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [message, setMessage] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    ship_name: "",
    role: "",
    quantity: 1,
    status: "Active",
    notes: "",
  });

  useEffect(() => {
    loadPage();
  }, []);

  const totalShips = useMemo(
    () => ships.reduce((total, ship) => total + Number(ship.quantity || 0), 0),
    [ships]
  );

  const totalOwners = useMemo(
    () => new Set(ships.map((ship) => ship.rsi_handle)).size,
    [ships]
  );

  const roles = useMemo(
    () => ["All", ...new Set(ships.map((ship) => ship.role).filter(Boolean))],
    [ships]
  );

  const filteredShips = useMemo(() => {
    return ships.filter((ship) => {
      const matchesRole = roleFilter === "All" || ship.role === roleFilter;
      const matchesSearch =
        ship.ship_name?.toLowerCase().includes(search.toLowerCase()) ||
        ship.rsi_handle?.toLowerCase().includes(search.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [ships, roleFilter, search]);

  async function loadPage() {
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;
    setUser(currentUser);

    if (currentUser) {
      const { data: memberData } = await supabase
        .from("members")
        .select("*")
        .eq("email", currentUser.email)
        .single();

      setMember(memberData || null);
    }

    fetchShips();
  }

  async function fetchShips() {
    const { data, error } = await supabase
      .from("fleet")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setShips(data || []);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function addShip(event) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("You must be logged in to add ships.");
      return;
    }

    if (!member || member.approved !== true) {
      setMessage("You must be an approved UCOR member to add ships.");
      return;
    }

    const { error } = await supabase.from("fleet").insert([
      {
        user_id: user.id,
        rsi_handle: member.rsi_handle,
        ship_name: form.ship_name,
        role: form.role,
        quantity: Number(form.quantity),
        status: form.status,
        notes: form.notes,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ship added successfully.");

    setForm({
      ship_name: "",
      role: "",
      quantity: 1,
      status: "Active",
      notes: "",
    });

    fetchShips();
  }

  async function deleteShip(ship) {
    const confirmed = window.confirm(`Delete ${ship.ship_name} from your fleet?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("fleet")
      .delete()
      .eq("id", ship.id)
      .eq("user_id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Ship deleted.");
    fetchShips();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Corporation
              </p>
              <h1 className="mt-3 text-5xl font-black">Org Fleet</h1>
              <p className="mt-3 max-w-2xl text-zinc-400">
                View UCOR’s total fleet strength, member-owned ships, and operational roles.
              </p>

              {user && (
                <p className="mt-4 text-sm text-zinc-500">
                  Logged in as: {user.email}
                </p>
              )}

              {member && (
                <p className="mt-1 text-sm font-bold text-red-400">
                  RSI Handle: {member.rsi_handle}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Home
              </a>
              <a href="/fleet" className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600">
                Org Fleet
              </a>
              <a href="/my-fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                My Fleet
              </a>
              <a href="/admin" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Admin
              </a>

              {user ? (
                <button onClick={logout} className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30">
                  Logout
                </button>
              ) : (
                <a href="/login" className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30">
                  Login
                </a>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Total Ships</p>
              <p className="mt-2 text-4xl font-black text-red-400">{totalShips}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Members Contributing</p>
              <p className="mt-2 text-4xl font-black text-red-400">{totalOwners}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Fleet Roles</p>
              <p className="mt-2 text-4xl font-black text-red-400">{roles.length - 1}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <form onSubmit={addShip} className="h-fit rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10">
          <h2 className="text-2xl font-black">Add Ship</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Ships are attached to your approved UCOR member profile.
          </p>

          {message && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
              {message}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <input
              placeholder="Ship Name"
              value={form.ship_name}
              onChange={(e) => updateForm("ship_name", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              required
            />

            <select
              value={form.role}
              onChange={(e) => updateForm("role", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              required
            >
              <option value="">Select Role</option>
              <option>Combat</option>
              <option>Racing</option>
              <option>Cargo</option>
              <option>Mining</option>
              <option>Medical</option>
              <option>Exploration</option>
              <option>Salvage</option>
              <option>Support</option>
              <option>Multi-role</option>
            </select>

            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => updateForm("quantity", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              required
            />

            <select
              value={form.status}
              onChange={(e) => updateForm("status", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            >
              <option>Active</option>
              <option>Loaner</option>
              <option>Concept</option>
              <option>Stored</option>
              <option>Sold</option>
              <option>Melted</option>
            </select>

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <button type="submit" className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
              Add Ship
            </button>
          </div>
        </form>

        <div>
          <div className="mb-6 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-black">Fleet Registry</h2>
              <p className="mt-1 text-sm text-zinc-500">Search and filter all registered ships.</p>
            </div>

            <input
              placeholder="Search ship or owner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </div>

          {filteredShips.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
              No ships found.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredShips.map((ship) => (
                <div key={ship.id} className="rounded-3xl border border-zinc-800 bg-black/60 p-5 transition hover:border-red-900">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{ship.ship_name}</h3>
                      <p className="mt-1 text-sm text-zinc-500">Owner: {ship.rsi_handle}</p>
                    </div>

                    <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-200">
                      Qty {ship.quantity}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300">{ship.role}</span>
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300">{ship.status}</span>
                  </div>

                  {ship.notes && (
                    <p className="mt-5 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-400">
                      {ship.notes}
                    </p>
                  )}

                  {user && ship.user_id === user.id && (
                    <button
                      onClick={() => deleteShip(ship)}
                      className="mt-5 rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                    >
                      Delete Ship
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}