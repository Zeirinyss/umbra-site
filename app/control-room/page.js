"use client";

import { useEffect, useState } from "react";

const EVENT_TYPES = [
  { value: "operation", label: "Operation" },
  { value: "training", label: "Training" },
  { value: "race", label: "Race" },
  { value: "meeting", label: "Meeting" },
  { value: "social", label: "Social" },
];

const blankEventForm = {
  title: "",
  description: "",
  location: "",
  event_type: "operation",
  start_time: "",
  end_time: "",
};

export default function ControlRoomPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [unlockMessage, setUnlockMessage] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);

  const [eventForm, setEventForm] = useState(blankEventForm);
  const [editingEventId, setEditingEventId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("umbra_control_room_code");

    if (stored) {
      setSavedCode(stored);
      setUnlocked(true);
      loadData(stored);
    }
  }, []);

  async function unlockControlRoom(event) {
    event.preventDefault();
    setUnlockMessage("");

    const response = await fetch("/api/control-room/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      setUnlockMessage(data.error || "Invalid code.");
      return;
    }

    localStorage.setItem("umbra_control_room_code", code);
    setSavedCode(code);
    setUnlocked(true);
    await loadData(code);
  }

  function lockControlRoom() {
    localStorage.removeItem("umbra_control_room_code");
    setUnlocked(false);
    setSavedCode("");
    setCode("");
    setEvents([]);
    setMembers([]);
    setRequests([]);
  }

  async function apiFetch(url, options = {}, overrideCode = null) {
    const activeCode = overrideCode || savedCode;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-control-room-code": activeCode,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  async function loadData(activeCode = savedCode) {
    setLoading(true);
    setMessage("");

    try {
      await Promise.all([
        fetchEvents(activeCode),
        fetchMembers(activeCode),
        fetchRequests(activeCode),
      ]);
    } catch (error) {
      setMessage(error.message);
    }

    setLoading(false);
  }

  async function fetchEvents(activeCode = savedCode) {
    const data = await apiFetch("/api/control-room/events", {}, activeCode);
    setEvents(data.events || []);
  }

  async function fetchMembers(activeCode = savedCode) {
    const data = await apiFetch("/api/control-room/members", {}, activeCode);
    setMembers(data.members || []);
  }

  async function fetchRequests(activeCode = savedCode) {
    const data = await apiFetch(
      "/api/control-room/member-requests",
      {},
      activeCode
    );

    setRequests(data.requests || []);
  }

  function updateEventForm(field, value) {
    setEventForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toDateTimeLocal(date) {
    if (!date) return "";

    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  function formatDate(date) {
    if (!date) return "No date";

    return new Date(date).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function startEditEvent(event) {
    setEditingEventId(event.id);

    setEventForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      event_type: event.event_type || "operation",
      start_time: toDateTimeLocal(event.start_time),
      end_time: toDateTimeLocal(event.end_time),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditEvent() {
    setEditingEventId(null);
    setEventForm(blankEventForm);
  }

  async function saveEvent(event) {
    event.preventDefault();
    setMessage("");

    if (!eventForm.title || !eventForm.start_time || !eventForm.end_time) {
      setMessage("Title, start time, and end time are required.");
      return;
    }

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      location: eventForm.location,
      event_type: eventForm.event_type,
      start_time: new Date(eventForm.start_time).toISOString(),
      end_time: new Date(eventForm.end_time).toISOString(),
    };

    try {
      if (editingEventId) {
        await apiFetch("/api/control-room/events", {
          method: "PATCH",
          body: JSON.stringify({
            id: editingEventId,
            ...payload,
          }),
        });

        setMessage("Event updated.");
      } else {
        await apiFetch("/api/control-room/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Event created.");
      }

      setEventForm(blankEventForm);
      setEditingEventId(null);
      await fetchEvents();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteEvent(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      await apiFetch("/api/control-room/events", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      await fetchEvents();
      setMessage("Event deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function approveRequest(request) {
    if (!confirm(`Accept "${request.rsi_handle || request.email}" as a member?`)) {
      return;
    }

    try {
      await apiFetch("/api/control-room/member-requests", {
        method: "POST",
        body: JSON.stringify({
          requestId: request.id,
          email: request.email,
          rsi_handle: request.rsi_handle,
          discord: request.discord,
          division: request.division,
          user_id: request.user_id,
        }),
      });

      await fetchRequests();
      await fetchMembers();
      setMessage("Member accepted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateMember(memberId, updates) {
    try {
      await apiFetch("/api/control-room/members", {
        method: "PATCH",
        body: JSON.stringify({
          id: memberId,
          updates,
        }),
      });

      await fetchMembers();
      setMessage("Member updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteMember(memberId, handle) {
    if (!confirm(`Delete member "${handle}"?`)) return;

    try {
      await apiFetch("/api/control-room/members", {
        method: "DELETE",
        body: JSON.stringify({ id: memberId }),
      });

      await fetchMembers();
      setMessage("Member deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <form
          onSubmit={unlockControlRoom}
          className="w-full max-w-md rounded-3xl border border-red-950 bg-black/70 p-8 shadow-2xl shadow-red-950/30"
        >
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Umbra Control Room
          </p>

          <h1 className="mt-4 text-4xl font-black">Access Code</h1>

          <p className="mt-3 text-zinc-400">
            Enter the control room code to continue.
          </p>

          {unlockMessage && (
            <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
              {unlockMessage}
            </div>
          )}

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            className="mt-6 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-2xl font-black tracking-widest outline-none focus:border-red-700"
          />

          <button className="mt-5 w-full rounded-xl bg-red-700 p-4 font-black hover:bg-red-600">
            Unlock Control Room
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-red-950 bg-black px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/10 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
                <img
                  src="/logo.png"
                  alt="Umbra Logo"
                  className="h-9 w-9 object-contain"
                />
              </div>

              <div>
                <p className="text-xl font-black tracking-[0.25em]">UMBRA</p>
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
                  Control Room
                </p>
              </div>
            </a>

            <button
              onClick={lockControlRoom}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Hidden Admin
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Control Room
          </h1>

          <p className="mt-3 text-zinc-400">
            Code-protected controls for events, requests, and members.
          </p>
        </div>
      </section>

      {(message || loading) && (
        <div className="mx-auto mt-5 max-w-5xl px-4">
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
            {loading ? "Loading..." : message}
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-8">
        <form
          onSubmit={saveEvent}
          className="rounded-3xl border border-red-950/80 bg-black/60 p-5 shadow-2xl shadow-red-950/10"
        >
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            Events
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {editingEventId ? "Edit Event" : "Add Event"}
          </h2>

          <div className="mt-6 grid gap-4">
            <input
              value={eventForm.title}
              onChange={(e) => updateEventForm("title", e.target.value)}
              placeholder="Event title"
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <select
              value={eventForm.event_type}
              onChange={(e) => updateEventForm("event_type", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <textarea
              value={eventForm.description}
              onChange={(e) => updateEventForm("description", e.target.value)}
              placeholder="Description"
              className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <input
              value={eventForm.location}
              onChange={(e) => updateEventForm("location", e.target.value)}
              placeholder="Location"
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <label className="grid gap-2">
              <span className="text-sm text-zinc-400">Start Time</span>
              <input
                type="datetime-local"
                value={eventForm.start_time}
                onChange={(e) => updateEventForm("start_time", e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-zinc-400">End Time</span>
              <input
                type="datetime-local"
                value={eventForm.end_time}
                onChange={(e) => updateEventForm("end_time", e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              />
            </label>

            <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
              {editingEventId ? "Save Event" : "Create Event"}
            </button>

            {editingEventId && (
              <button
                type="button"
                onClick={cancelEditEvent}
                className="rounded-xl border border-zinc-800 p-3 font-black hover:bg-zinc-900"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <section className="rounded-3xl border border-zinc-800 bg-black/60 p-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            Access Requests
          </p>

          <h2 className="mt-2 text-3xl font-black">Pending Approval</h2>

          <div className="mt-6 grid gap-4">
            {requests.length === 0 ? (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-400">
                No pending requests.
              </p>
            ) : (
              requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <h3 className="text-xl font-black">
                    {request.rsi_handle || "Unnamed Request"}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">{request.email}</p>

                  <p className="mt-2 text-sm text-zinc-400">
                    Discord: {request.discord || "N/A"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    Division: {request.division || "N/A"}
                  </p>

                  <p className="mt-1 text-sm text-red-400">
                    Status: {request.status || "pending"}
                  </p>

                  <button
                    onClick={() => approveRequest(request)}
                    className="mt-4 w-full rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white hover:bg-green-600"
                  >
                    Accept Member
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-black/60 p-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            Current Events
          </p>

          <h2 className="mt-2 text-3xl font-black">Manage Events</h2>

          <div className="mt-6 grid gap-4">
            {events.length === 0 ? (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-400">
                No events found.
              </p>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
                    {event.event_type || "operation"}
                  </p>

                  <h3 className="mt-2 text-xl font-black">{event.title}</h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    {formatDate(event.start_time)}
                  </p>

                  {event.location && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {event.location}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => startEditEvent(event)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-900"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-black/60 p-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            Members
          </p>

          <h2 className="mt-2 text-3xl font-black">Member Admin</h2>

          <div className="mt-6 grid gap-4">
            {members.length === 0 ? (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-zinc-400">
                No members found.
              </p>
            ) : (
              members.map((member) => (
                <article
                  key={member.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <h3 className="text-xl font-black">
                    {member.rsi_handle || "Unnamed Member"}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">{member.email}</p>

                  <p className="mt-2 text-sm text-red-400">
                    Rank: {member.rank || "Member"}
                  </p>

                  {!member.user_id && (
                    <p className="mt-2 text-xs font-bold text-red-400">
                      Missing user_id
                    </p>
                  )}

                  <div className="mt-4 grid gap-3">
                    <select
                      value={member.rank || "Member"}
                      onChange={(e) =>
                        updateMember(member.id, { rank: e.target.value })
                      }
                      className="rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
                    >
                      <option>Member</option>
                      <option>Officer</option>
                      <option>Racing Lead</option>
                      <option>Logistics Lead</option>
                      <option>Security Lead</option>
                      <option>Command</option>
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          updateMember(member.id, {
                            approved: !member.approved,
                          })
                        }
                        className={`rounded-xl px-4 py-2 text-sm font-bold ${
                          member.approved
                            ? "border border-zinc-700 bg-zinc-900 text-zinc-200"
                            : "bg-green-700 text-white hover:bg-green-600"
                        }`}
                      >
                        {member.approved ? "Unapprove" : "Approve"}
                      </button>

                      <button
                        onClick={() =>
                          deleteMember(
                            member.id,
                            member.rsi_handle || member.email
                          )
                        }
                        className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Control Room
      </footer>
    </main>
  );
}