"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id;

  const [member, setMember] = useState(null);
  const [ships, setShips] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [message, setMessage] = useState("Loading profile...");

  useEffect(() => {
    initPage();
  }, []);

  const totalShips = useMemo(
    () => ships.reduce((total, ship) => total + Number(ship.quantity || 0), 0),
    [ships]
  );

  const namedShips = useMemo(
    () => ships.filter((ship) => ship.custom_ship_name).length,
    [ships]
  );

  async function initPage() {
    const status = await getUserStatus();

    if (status.status === "guest") {
      window.location.href = "/login";
      return;
    }

    if (status.status === "pending") {
      window.location.href = "/pending";
      return;
    }

    await loadProfile();
  }

  async function loadProfile() {
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .eq("approved", true)
      .maybeSingle();

    if (memberError || !memberData) {
      setMessage("Member profile not found.");
      return;
    }

    setMember(memberData);

    const { data: shipData } = await supabase
      .from("fleet")
      .select("*")
      .eq("user_id", memberData.user_id)
      .order("created_at", { ascending: false });

    setShips(shipData || []);

    const { data: rsvpData } = await supabase
      .from("event_attendees")
      .select("*")
      .eq("user_id", memberData.user_id)
      .order("created_at", { ascending: false });

    setRsvps(rsvpData || []);

    const eventIds = (rsvpData || []).map((rsvp) => rsvp.event_id);

    if (eventIds.length > 0) {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .in("id", eventIds)
        .order("start_time", { ascending: true });

      setEvents(eventData || []);
    }

    setMessage("");
  }

  if (message) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-3xl border border-red-900 bg-black/70 p-8 text-center shadow-2xl shadow-red-950/30">
            <p className="text-red-300">{message}</p>

            <a
              href="/members"
              className="mt-6 inline-block rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
            >
              Back to Members
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Member Profile
              </p>

              <h1 className="mt-3 text-5xl font-black">
                {member.rsi_handle || "Unknown Handle"}
              </h1>

              <p className="mt-3 text-red-400">{member.rank || "Member"}</p>

              <p className="mt-2 text-sm text-zinc-500">{member.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Home
              </a>

              <a
                href="/members"
                className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Members
              </a>

              <a
                href="/fleet"
                className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Org Fleet
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <StatCard label="Registered Ships" value={totalShips} />
            <StatCard label="Named Ships" value={namedShips} />
            <StatCard label="RSVP Events" value={events.length} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6">
          <h2 className="text-3xl font-black">Fleet</h2>

          {ships.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
              No ships registered.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {ships.map((ship) => (
                <button
                  key={ship.id}
                  onClick={() => setSelectedShip(ship)}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-red-900 hover:bg-black"
                >
                  {ship.custom_ship_name && (
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-red-500">
                      {ship.custom_ship_name}
                    </p>
                  )}

                  <h3 className="mt-1 text-2xl font-black">
                    {ship.ship_name}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-black px-3 py-1 text-sm text-zinc-300">
                      {ship.role || "No Role"}
                    </span>

                    <span className="rounded-full bg-black px-3 py-1 text-sm text-zinc-300">
                      Qty {ship.quantity}
                    </span>

                    <span className="rounded-full bg-black px-3 py-1 text-sm text-zinc-300">
                      {ship.status}
                    </span>
                  </div>

                  {ship.notes && (
                    <p className="mt-5 line-clamp-3 border-t border-zinc-800 pt-4 text-sm leading-6 text-zinc-400">
                      {ship.notes}
                    </p>
                  )}

                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-red-500">
                    Click for details
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-zinc-800 bg-black/60 p-6">
          <h2 className="text-3xl font-black">Upcoming RSVPs</h2>

          {events.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
              No RSVP events found.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-lg font-black">{event.title}</p>

                  <p className="mt-2 text-sm text-red-400">
                    {new Date(event.start_time).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>

                  {event.location && (
                    <p className="mt-2 text-sm text-zinc-500">
                      {event.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>

      {selectedShip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                {selectedShip.custom_ship_name && (
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-red-500">
                    {selectedShip.custom_ship_name}
                  </p>
                )}

                <h2 className="mt-1 text-3xl font-black">
                  {selectedShip.ship_name}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Owner: {member.rsi_handle}
                </p>
              </div>

              <button
                onClick={() => setSelectedShip(null)}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-2 font-bold hover:bg-zinc-900"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <InfoRow label="Role" value={selectedShip.role || "No Role"} />
              <InfoRow label="Quantity" value={selectedShip.quantity} />
              <InfoRow label="Status" value={selectedShip.status} />

              {selectedShip.custom_ship_name && (
                <InfoRow label="Named Ship" value={selectedShip.custom_ship_name} />
              )}

              {selectedShip.notes && (
                <div className="rounded-xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-500">Notes</p>
                  <p className="mt-2 leading-7 text-zinc-300">
                    {selectedShip.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => setSelectedShip(null)}
                className="rounded-xl bg-red-700 px-5 py-3 font-black hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-red-400">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-red-400">{value || "N/A"}</p>
    </div>
  );
}