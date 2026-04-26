"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppEventsAdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("Loading...");

  const [editingEvent, setEditingEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    event_type: "Operation",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    loadPage();
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function loadPage() {
    setMessage("Checking admin access...");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) {
      setMessage("You must be logged in.");
      return;
    }

    setUser(currentUser);

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!adminData) {
      setMessage("Access denied. Admin only.");
      return;
    }

    setIsAdmin(true);
    setMessage("");
    fetchEvents();
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setEvents(data || []);
  }

  async function saveEvent(e) {
    e.preventDefault();
    setMessage("");

    if (!form.title || !form.start_time || !form.end_time) {
      setMessage("Title, start time, and end time are required.");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      location: form.location,
      event_type: form.event_type,
      start_time: form.start_time,
      end_time: form.end_time,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingEvent.id);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Event updated.");
    } else {
      const { error } = await supabase.from("events").insert([payload]);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage("Event created.");
    }

    resetForm();
    fetchEvents();
  }

  function editEvent(event) {
    setEditingEvent(event);

    setForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      event_type: event.event_type || "Operation",
      start_time: event.start_time ? event.start_time.slice(0, 16) : "",
      end_time: event.end_time ? event.end_time.slice(0, 16) : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteEvent(event) {
    const confirmed = window.confirm(`Delete "${event.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Event deleted.");
    fetchEvents();

    if (editingEvent?.id === event.id) {
      resetForm();
    }
  }

  function resetForm() {
    setEditingEvent(null);

    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "Operation",
      start_time: "",
      end_time: "",
    });
  }

  function formatDate(date) {
    return new Date(date).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 p-6 text-white">
        <div className="rounded-2xl border border-red-900 bg-black/70 p-6">
          <h1 className="text-3xl font-black">Event Admin</h1>
          <p className="mt-4 text-red-300">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <section className="mx-auto max-w-3xl">
        <div className="mb-5 rounded-2xl border border-red-950 bg-black/70 p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
            Umbra Corporation
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {editingEvent ? "Edit Event" : "Create Event"}
          </h1>

          {user && (
            <p className="mt-2 text-sm text-zinc-500">
              Logged in as {user.email}
            </p>
          )}
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
            {message}
          </div>
        )}

        <form
          onSubmit={saveEvent}
          className="rounded-2xl border border-zinc-800 bg-black/70 p-5"
        >
          <div className="grid gap-4">
            <input
              placeholder="Event Title"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              required
            />

            <select
              value={form.event_type}
              onChange={(e) => updateForm("event_type", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            >
              <option>Operation</option>
              <option>Training</option>
              <option>Race</option>
              <option>Meeting</option>
              <option>Social</option>
            </select>

            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => updateForm("location", e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <label className="text-sm text-zinc-400">
              Start Time
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => updateForm("start_time", e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-white outline-none focus:border-red-700"
                required
              />
            </label>

            <label className="text-sm text-zinc-400">
              End Time
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => updateForm("end_time", e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-white outline-none focus:border-red-700"
                required
              />
            </label>

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
            />

            <button
              type="submit"
              className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600"
            >
              {editingEvent ? "Save Changes" : "Create Event"}
            </button>

            {editingEvent && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-800 p-3 font-bold hover:bg-zinc-900"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/70 p-5">
          <h2 className="text-2xl font-black">Events</h2>

          <div className="mt-4 space-y-4">
            {events.length === 0 ? (
              <p className="text-zinc-500">No events found.</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <p className="text-lg font-black">{event.title}</p>

                  <p className="mt-1 text-sm text-red-400">
                    {formatDate(event.start_time)}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {event.event_type || "Event"}
                    {event.location ? ` • ${event.location}` : ""}
                  </p>

                  {event.description && (
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {event.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => editEvent(event)}
                      className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-bold hover:bg-zinc-800"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteEvent(event)}
                      className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-2 font-bold text-red-200 hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}