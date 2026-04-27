"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

const POINTS_MAP = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

export default function RacingPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [message, setMessage] = useState("Checking access...");

  const [pilots, setPilots] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [results, setResults] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [startingGrid, setStartingGrid] = useState([]);

  const [pilotForm, setPilotForm] = useState({
    pilot_name: "",
    total_points: 0,
    wins: 0,
    podiums: 0,
    races_entered: 0,
  });

  const [trackForm, setTrackForm] = useState({
    name: "",
    location: "",
    description: "",
    image_url: "",
    video_url: "",
    recommended_ship: "",
  });

  const [resultForm, setResultForm] = useState({
    pilot_name: "",
    race_name: "",
    placement: "",
    race_date: "",
  });

  const [bracketForm, setBracketForm] = useState({
    round_name: "",
    slot_order: 1,
    pilot_name: "",
    status: "Pending",
  });

  useEffect(() => {
    loadPage();
  }, []);

  const nextTrack = useMemo(
    () => tracks.find((track) => track.is_next) || null,
    [tracks]
  );

  const sortedPilots = useMemo(() => {
    return [...pilots].sort((a, b) => {
      return Number(b.total_points || 0) - Number(a.total_points || 0);
    });
  }, [pilots]);

  const latestResults = useMemo(() => {
    return results.slice(0, 5);
  }, [results]);

  async function loadPage() {
    setMessage("Checking access...");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) {
      setAllowed(false);
      setMessage("You must be logged in to view Racing Division.");
      return;
    }

    setUser(currentUser);

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("email", currentUser.email)
      .maybeSingle();

    if (!memberData || memberData.approved !== true) {
      setAllowed(false);
      setMessage("Access denied. Approved UCOR members only.");
      return;
    }

    setMember(memberData);

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    setIsAdmin(!!adminData);
    setAllowed(true);
    setMessage("");

    await fetchAll();
  }

  async function fetchAll() {
    await Promise.all([
      fetchPilots(),
      fetchTracks(),
      fetchResults(),
      fetchBracket(),
      fetchStartingGrid(),
    ]);
  }

  async function fetchPilots() {
    const { data, error } = await supabase
      .from("race_pilots")
      .select("*")
      .order("total_points", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setPilots(data || []);
  }

  async function fetchTracks() {
    const { data, error } = await supabase
      .from("race_tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTracks(data || []);
  }

  async function fetchResults() {
    const { data, error } = await supabase
      .from("race_results")
      .select("*")
      .order("race_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setResults(data || []);
  }

  async function fetchBracket() {
    const { data, error } = await supabase
      .from("race_bracket")
      .select("*")
      .order("slot_order", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setBracket(data || []);
  }

  async function fetchStartingGrid() {
    const { data, error } = await supabase
      .from("race_starting_grid")
      .select("*")
      .order("grid_order", { ascending: true });

    if (error) {
      console.log("Starting grid error:", error.message);
      return;
    }

    setStartingGrid(data || []);
  }

  function updatePilotForm(field, value) {
    setPilotForm((current) => ({ ...current, [field]: value }));
  }

  function updateTrackForm(field, value) {
    setTrackForm((current) => ({ ...current, [field]: value }));
  }

  function updateResultForm(field, value) {
    setResultForm((current) => ({ ...current, [field]: value }));
  }

  function updateBracketForm(field, value) {
    setBracketForm((current) => ({ ...current, [field]: value }));
  }

  async function addPilot(e) {
    e.preventDefault();

    const { error } = await supabase.from("race_pilots").insert([
      {
        pilot_name: pilotForm.pilot_name,
        total_points: Number(pilotForm.total_points || 0),
        wins: Number(pilotForm.wins || 0),
        podiums: Number(pilotForm.podiums || 0),
        races_entered: Number(pilotForm.races_entered || 0),
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPilotForm({
      pilot_name: "",
      total_points: 0,
      wins: 0,
      podiums: 0,
      races_entered: 0,
    });

    await fetchAll();
  }

  async function deletePilot(id) {
    if (!confirm("Delete this pilot?")) return;

    const { error } = await supabase.from("race_pilots").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchAll();
  }

  async function addTrack(e) {
    e.preventDefault();

    const { error } = await supabase.from("race_tracks").insert([
      {
        name: trackForm.name,
        location: trackForm.location,
        description: trackForm.description,
        image_url: trackForm.image_url,
        video_url: trackForm.video_url,
        recommended_ship: trackForm.recommended_ship,
        is_next: tracks.length === 0,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTrackForm({
      name: "",
      location: "",
      description: "",
      image_url: "",
      video_url: "",
      recommended_ship: "",
    });

    await fetchTracks();
  }

  async function setNextTrack(id) {
    await supabase.from("race_tracks").update({ is_next: false }).neq("id", id);

    const { error } = await supabase
      .from("race_tracks")
      .update({ is_next: true })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchTracks();
  }

  async function deleteTrack(id) {
    if (!confirm("Delete this track?")) return;

    const { error } = await supabase.from("race_tracks").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchTracks();
  }

  async function addResult(e) {
    e.preventDefault();

    const placement = Number(resultForm.placement || 0);
    const points = POINTS_MAP[placement] || 0;
    const raceDate =
      resultForm.race_date || new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("race_results").insert([
      {
        pilot_name: resultForm.pilot_name,
        race_name: resultForm.race_name,
        placement,
        points,
        race_date: raceDate,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: pilot } = await supabase
      .from("race_pilots")
      .select("*")
      .eq("pilot_name", resultForm.pilot_name)
      .maybeSingle();

    if (pilot) {
      await supabase
        .from("race_pilots")
        .update({
          total_points: Number(pilot.total_points || 0) + points,
          wins: placement === 1 ? Number(pilot.wins || 0) + 1 : pilot.wins,
          podiums:
            placement >= 1 && placement <= 3
              ? Number(pilot.podiums || 0) + 1
              : pilot.podiums,
          races_entered: Number(pilot.races_entered || 0) + 1,
        })
        .eq("id", pilot.id);
    }

    setResultForm({
      pilot_name: "",
      race_name: "",
      placement: "",
      race_date: "",
    });

    await fetchAll();
    await generateStartingGrid(resultForm.race_name || "Next Race");
    await fetchStartingGrid();

    setMessage(`Result added. ${points} points awarded.`);
  }

  async function generateStartingGrid(raceName) {
    const { data: pilotData, error } = await supabase
      .from("race_pilots")
      .select("*");

    if (error || !pilotData) {
      setMessage(error?.message || "Failed to generate starting grid.");
      return;
    }

    const zeroPointPilots = pilotData.filter(
      (pilot) => Number(pilot.total_points || 0) === 0
    );

    const scoredPilots = pilotData.filter(
      (pilot) => Number(pilot.total_points || 0) > 0
    );

    for (let i = zeroPointPilots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zeroPointPilots[i], zeroPointPilots[j]] = [
        zeroPointPilots[j],
        zeroPointPilots[i],
      ];
    }

    scoredPilots.sort(
      (a, b) => Number(a.total_points || 0) - Number(b.total_points || 0)
    );

    const finalGrid = [...zeroPointPilots, ...scoredPilots];

    await supabase.from("race_starting_grid").delete().neq("id", "");

    if (finalGrid.length === 0) return;

    const rows = finalGrid.map((pilot, index) => ({
      race_name: raceName,
      grid_order: index + 1,
      pilot_name: pilot.pilot_name,
      total_points: Number(pilot.total_points || 0),
    }));

    const { error: insertError } = await supabase
      .from("race_starting_grid")
      .insert(rows);

    if (insertError) {
      setMessage(insertError.message);
    }
  }

  async function deleteResult(id) {
    if (
      !confirm(
        "Delete this result? This will not automatically remove points from standings."
      )
    )
      return;

    const { error } = await supabase.from("race_results").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchResults();
  }

  async function addBracketSlot(e) {
    e.preventDefault();

    const { error } = await supabase.from("race_bracket").insert([
      {
        round_name: bracketForm.round_name,
        slot_order: Number(bracketForm.slot_order || 1),
        pilot_name: bracketForm.pilot_name,
        status: bracketForm.status,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBracketForm({
      round_name: "",
      slot_order: 1,
      pilot_name: "",
      status: "Pending",
    });

    await fetchBracket();
  }

  async function deleteBracketSlot(id) {
    if (!confirm("Delete this bracket slot?")) return;

    const { error } = await supabase.from("race_bracket").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchBracket();
  }

  function getVideoEmbed(url) {
    if (!url) return "";

    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    return url;
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <Header />

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-900 bg-black/70 p-8 text-center shadow-2xl shadow-red-950/20">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              Umbra Racing Division
            </p>

            <h1 className="mt-4 text-3xl font-black">Access Restricted</h1>

            <p className="mt-4 text-zinc-400">{message}</p>

            <a
              href="/"
              className="mt-6 inline-block rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
            >
              Home
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Racing Division
              </p>

              <h1 className="mt-3 text-5xl font-black md:text-6xl">
                Racing Command
              </h1>

              <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
                Track standings, next race location, brackets, official race
                results, and starting grid for Umbra Racing operations.
              </p>

              {member && (
                <p className="mt-4 text-sm text-red-400">
                  Signed in as {member.rsi_handle}
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="rounded-2xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm font-bold text-red-200 shadow-lg shadow-red-950/20">
                Racing Admin Controls Enabled
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <StatCard label="Pilots" value={pilots.length} />
            <StatCard label="Tracks" value={tracks.length} />
            <StatCard label="Results" value={results.length} />
            <StatCard label="Grid Slots" value={startingGrid.length} />
          </div>
        </div>
      </section>

      {message && (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
            {message}
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <Panel
            eyebrow="Championship"
            title="Standings"
            description="Current pilot rankings based on championship points."
          >
            {sortedPilots.length === 0 ? (
              <EmptyState text="No pilots added yet." />
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950 text-xs uppercase tracking-widest text-zinc-500">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Pilot</th>
                      <th className="p-3">Pts</th>
                      <th className="p-3">Wins</th>
                      <th className="p-3">Podiums</th>
                      <th className="p-3">Races</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedPilots.map((pilot, index) => (
                      <tr key={pilot.id} className="border-t border-zinc-900">
                        <td className="p-3 font-black text-red-400">
                          #{index + 1}
                        </td>
                        <td className="p-3 font-bold">{pilot.pilot_name}</td>
                        <td className="p-3">{pilot.total_points}</td>
                        <td className="p-3">{pilot.wins}</td>
                        <td className="p-3">{pilot.podiums}</td>
                        <td className="p-3">{pilot.races_entered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="Next Race"
            title="Starting Grid"
            description="Lowest championship points start first. Zero-point pilots are randomized."
          >
            {startingGrid.length === 0 ? (
              <EmptyState text="No starting grid generated yet. Add a race result to generate one." />
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {startingGrid.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-xs uppercase tracking-widest text-red-500">
                      Grid Position #{slot.grid_order}
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {slot.pilot_name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {slot.total_points} points
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="Tournament"
            title="Race Bracket"
            description="Bracket slots and race advancement status."
          >
            {bracket.length === 0 ? (
              <EmptyState text="No bracket slots added yet." />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {bracket.map((slot) => (
                  <div
                    key={slot.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-xs uppercase tracking-widest text-red-500">
                      {slot.round_name}
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {slot.pilot_name || "TBD"}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Slot {slot.slot_order} • {slot.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="History"
            title="Past Results"
            description="Latest official race placements and awarded points."
          >
            {results.length === 0 ? (
              <EmptyState text="No race results yet." />
            ) : (
              <div className="mt-6 space-y-4">
                {latestResults.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <p className="text-xl font-black">{result.race_name}</p>

                    <p className="mt-1 text-red-400">
                      #{result.placement} — {result.pilot_name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {result.points} points • {result.race_date}
                    </p>
                  </div>
                ))}

                {results.length > 5 && (
                  <p className="text-sm text-zinc-500">
                    Showing latest 5 results.
                  </p>
                )}
              </div>
            )}
          </Panel>
        </div>

        <aside className="space-y-8">
          <Panel
            eyebrow="Featured Track"
            title="Next Track"
            description="Selected race location for the next scheduled racing event."
          >
            {!nextTrack ? (
              <EmptyState text="No next track selected." />
            ) : (
              <div className="mt-5">
                <h2 className="text-3xl font-black">{nextTrack.name}</h2>

                {nextTrack.location && (
                  <p className="mt-2 text-red-400">{nextTrack.location}</p>
                )}

                {nextTrack.recommended_ship && (
                  <p className="mt-2 text-sm text-zinc-500">
                    Recommended: {nextTrack.recommended_ship}
                  </p>
                )}

                {nextTrack.image_url && (
                  <img
                    src={nextTrack.image_url}
                    alt={nextTrack.name}
                    className="mt-5 h-56 w-full rounded-2xl border border-zinc-800 object-cover"
                  />
                )}

                {nextTrack.video_url && (
                  <iframe
                    src={getVideoEmbed(nextTrack.video_url)}
                    className="mt-5 aspect-video w-full rounded-2xl border border-zinc-800"
                    allowFullScreen
                  />
                )}

                {nextTrack.description && (
                  <p className="mt-5 leading-7 text-zinc-400">
                    {nextTrack.description}
                  </p>
                )}
              </div>
            )}
          </Panel>

          {isAdmin && (
            <Panel
              eyebrow="Admin"
              title="Race Management"
              description="Admin tools for pilots, tracks, results, and bracket setup."
            >
              <div className="mt-6 space-y-6">
                <AdminCard title="Add Pilot">
                  <form onSubmit={addPilot} className="grid gap-3">
                    <input
                      placeholder="Pilot Name"
                      value={pilotForm.pilot_name}
                      onChange={(e) =>
                        updatePilotForm("pilot_name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Points"
                        value={pilotForm.total_points}
                        onChange={(e) =>
                          updatePilotForm("total_points", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />

                      <input
                        type="number"
                        placeholder="Wins"
                        value={pilotForm.wins}
                        onChange={(e) =>
                          updatePilotForm("wins", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />

                      <input
                        type="number"
                        placeholder="Podiums"
                        value={pilotForm.podiums}
                        onChange={(e) =>
                          updatePilotForm("podiums", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />

                      <input
                        type="number"
                        placeholder="Races"
                        value={pilotForm.races_entered}
                        onChange={(e) =>
                          updatePilotForm("races_entered", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />
                    </div>

                    <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
                      Add Pilot
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {pilots.map((pilot) => (
                      <div
                        key={pilot.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black p-3"
                      >
                        <span>{pilot.pilot_name}</span>

                        <button
                          onClick={() => deletePilot(pilot.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </AdminCard>

                <AdminCard title="Add Track">
                  <form onSubmit={addTrack} className="grid gap-3">
                    <input
                      placeholder="Track Name"
                      value={trackForm.name}
                      onChange={(e) =>
                        updateTrackForm("name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      required
                    />

                    <input
                      placeholder="Location"
                      value={trackForm.location}
                      onChange={(e) =>
                        updateTrackForm("location", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <input
                      placeholder="Recommended Ship"
                      value={trackForm.recommended_ship}
                      onChange={(e) =>
                        updateTrackForm("recommended_ship", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <input
                      placeholder="Track Image URL"
                      value={trackForm.image_url}
                      onChange={(e) =>
                        updateTrackForm("image_url", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <input
                      placeholder="Track Video URL"
                      value={trackForm.video_url}
                      onChange={(e) =>
                        updateTrackForm("video_url", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <textarea
                      placeholder="Track Description"
                      value={trackForm.description}
                      onChange={(e) =>
                        updateTrackForm("description", e.target.value)
                      }
                      className="min-h-24 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
                      Add Track
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="rounded-xl border border-zinc-800 bg-black p-3"
                      >
                        <p className="font-bold">{track.name}</p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => setNextTrack(track.id)}
                            className="rounded-lg border border-zinc-800 px-3 py-1 text-sm hover:bg-zinc-900"
                          >
                            Set Next
                          </button>

                          <button
                            onClick={() => deleteTrack(track.id)}
                            className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AdminCard>

                <AdminCard title="Add Result">
                  <form onSubmit={addResult} className="grid gap-3">
                    <input
                      placeholder="Race Name"
                      value={resultForm.race_name}
                      onChange={(e) =>
                        updateResultForm("race_name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      required
                    />

                    <select
                      value={resultForm.pilot_name}
                      onChange={(e) =>
                        updateResultForm("pilot_name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      required
                    >
                      <option value="">Select Pilot</option>
                      {pilots.map((pilot) => (
                        <option key={pilot.id} value={pilot.pilot_name}>
                          {pilot.pilot_name}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Place"
                        value={resultForm.placement}
                        onChange={(e) =>
                          updateResultForm("placement", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                        required
                      />

                      <input
                        type="date"
                        value={resultForm.race_date}
                        onChange={(e) =>
                          updateResultForm("race_date", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />
                    </div>

                    <p className="rounded-xl border border-zinc-800 bg-black/50 p-3 text-sm text-zinc-400">
                      Points will be awarded automatically from placement.
                    </p>

                    <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
                      Add Result + Generate Grid
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black p-3"
                      >
                        <span>{result.race_name}</span>

                        <button
                          onClick={() => deleteResult(result.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </AdminCard>

                <AdminCard title="Add Bracket Slot">
                  <form onSubmit={addBracketSlot} className="grid gap-3">
                    <input
                      placeholder="Round Name"
                      value={bracketForm.round_name}
                      onChange={(e) =>
                        updateBracketForm("round_name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      required
                    />

                    <input
                      placeholder="Pilot Name"
                      value={bracketForm.pilot_name}
                      onChange={(e) =>
                        updateBracketForm("pilot_name", e.target.value)
                      }
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Slot"
                        value={bracketForm.slot_order}
                        onChange={(e) =>
                          updateBracketForm("slot_order", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      />

                      <select
                        value={bracketForm.status}
                        onChange={(e) =>
                          updateBracketForm("status", e.target.value)
                        }
                        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                      >
                        <option>Pending</option>
                        <option>Winner</option>
                        <option>Eliminated</option>
                      </select>
                    </div>

                    <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
                      Add Slot
                    </button>
                  </form>

                  <div className="mt-4 space-y-2">
                    {bracket.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black p-3"
                      >
                        <span>
                          {slot.round_name} — {slot.pilot_name || "TBD"}
                        </span>

                        <button
                          onClick={() => deleteBracketSlot(slot.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </AdminCard>
              </div>
            </Panel>
          )}
        </aside>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Racing Division
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-red-950 bg-black px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/10 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
            <img
              src="/logo.png"
              alt="Umbra Logo"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
              Racing Division
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
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

function Panel({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      )}

      {children}
    </section>
  );
}

function AdminCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="mb-4 text-2xl font-black">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
      {text}
    </p>
  );
}