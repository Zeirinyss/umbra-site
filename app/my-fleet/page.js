"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MyFleetPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [ships, setShips] = useState([]);
  const [message, setMessage] = useState("Loading...");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMyFleet();
  }, []);

  const totalShips = useMemo(() => {
    return ships.reduce((total, ship) => total + Number(ship.quantity || 0), 0);
  }, [ships]);

  const filteredShips = useMemo(() => {
    return ships.filter((ship) =>
      ship.ship_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [ships, search]);

  async function loadMyFleet() {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) {
      setMessage("You must be logged in to view your fleet.");
      return;
    }

    setUser(currentUser);

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("email", currentUser.email)
      .single();

    setMember(memberData || null);

    const { data, error } = await supabase
      .from("fleet")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setShips(data || []);
    setMessage("");
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
    loadMyFleet();
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
              <h1 className="mt-3 text-5xl font-black">My Fleet</h1>
              <p className="mt-3 max-w-2xl text-zinc-400">
                Manage ships attached to your approved UCOR member account.
              </p>

              {user && <p className="mt-4 text-sm text-zinc-500">{user.email}</p>}

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
              <a href="/fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Org Fleet
              </a>
              <a href="/my-fleet" className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600">
                My Fleet
              </a>
              <a href="/admin" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Admin
              </a>

              <button onClick={logout} className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30">
                Logout
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">My Total Ships</p>
              <p className="mt-2 text-4xl font-black text-red-400">{totalShips}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">Ships Listed</p>
              <p className="mt-2 text-4xl font-black text-red-400">{ships.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">Personal Fleet Registry</h2>
            <p className="mt-1 text-sm text-zinc-500">Only ships owned by your logged-in account.</p>
          </div>

          <input
            placeholder="Search my ships"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
          />
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-200">
            {message}
          </div>
        )}

        {filteredShips.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
            No ships found. Add ships from the Org Fleet page.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredShips.map((ship) => (
              <div key={ship.id} className="rounded-3xl border border-zinc-800 bg-black/60 p-5 transition hover:border-red-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">{ship.ship_name}</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {ship.role} • {ship.status}
                    </p>
                  </div>

                  <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-sm font-bold text-red-200">
                    Qty {ship.quantity}
                  </span>
                </div>

                {ship.notes && (
                  <p className="mt-5 border-t border-zinc-900 pt-4 text-sm leading-6 text-zinc-400">
                    {ship.notes}
                  </p>
                )}

                <button
                  onClick={() => deleteShip(ship)}
                  className="mt-5 rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                >
                  Delete Ship
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}