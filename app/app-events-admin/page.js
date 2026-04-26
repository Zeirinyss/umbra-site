"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const EVENT_TYPES = ["Operation", "Training", "Race", "Meeting", "Social"];

function toDateTimeLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventClass(type) {
  switch (type) {
    case "Training":
      return "border-blue-800 bg-blue-950/70 text-blue-100";
    case "Race":
      return "border-yellow-700 bg-yellow-950/70 text-yellow-100";
    case "Meeting":
      return "border-purple-800 bg-purple-950/70 text-purple-100";
    case "Social":
      return "border-emerald-800 bg-emerald-950/70 text-emerald-100";
    default:
      return "border-red-800 bg-red-950/70 text-red-100";
  }
}

export default function AppEventsAdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("Checking admin access...");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showForm, setShowForm] = useState(false);
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

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startDay);

    const days = [];

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);

      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start_time);
        return (
          eventDate.getFullYear() === day.getFullYear() &&
          eventDate.getMonth() === day.getMonth() &&
          eventDate.getDate() === day.getDate()
        );
      });

      const today = new Date();
      const isToday =
        today.getFullYear() === day.getFullYear() &&
        today.getMonth() === day.getMonth() &&
        today.getDate() === day.getDate();

      days.push({
        date: day,
        inCurrentMonth: day.getMonth() === month,
        isToday,
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, events]);

  async function loadPage() {
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
    await fetchEvents();
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

  function previousMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function openCreate(day) {
    const start = new Date(day.date);
    start.setHours(17, 0, 0, 0);

    const end = new Date(day.date);
    end.setHours(21, 0, 0, 0);

    setEditingEvent(null);
    setShowForm(true);
    setMessage("");

    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "Operation",
      start_time: toDateTimeLocal(start),
      end_time: toDateTimeLocal(end),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(event, e) {
    e.stopPropagation();

    setEditingEvent(event);
    setShowForm(true);
    setMessage("");

    setForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      event_type: event.event_type || "Operation",
      start_time: event.start_time ? toDateTimeLocal(event.start_time) : "",
      end_time: event.end_time ? toDateTimeLocal(event.end_time) : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
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
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
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
    await fetchEvents();
  }

  async function deleteEvent() {
    if (!editingEvent) return;

    const confirmed = window.confirm(`Delete "${editingEvent.title}"?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", editingEvent.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Event deleted.");
    resetForm();
    await fetchEvents();
  }

  function resetForm() {
    setShowForm(false);
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
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-2xl border border-red-950 bg-black/70 p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
            Umbra Corporation
          </p>

          <h1 className="mt-2 text-3xl font-black">Mobile Event Manager</h1>

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

        {showForm && (
          <form
            onSubmit={saveEvent}
            className="mb-6 rounded-2xl border border-zinc-800 bg-black/70 p-5"
          >
            <h2 className="mb-4 text-2xl font-black">
              {editingEvent ? "Edit Event" : "Create Event"}
            </h2>

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
                {EVENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
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
                  onClick={deleteEvent}
                  className="rounded-xl border border-red-900 bg-red-950/40 p-3 font-bold text-red-200 hover:bg-red-900/50"
                >
                  Delete Event
                </button>
              )}

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-800 p-3 font-bold hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-black/70 p-4">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-red-500">
                Calendar
              </p>
              <h2 className="mt-1 text-3xl font-black">{monthName}</h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={previousMonth}
                className="rounded-xl border border-zinc-800 px-3 py-2 font-bold hover:bg-zinc-900"
              >
                Prev
              </button>

              <button
                onClick={goToday}
                className="rounded-xl bg-red-700 px-3 py-2 font-bold hover:bg-red-600"
              >
                Today
              </button>

              <button
                onClick={nextMonth}
                className="rounded-xl border border-zinc-800 px-3 py-2 font-bold hover:bg-zinc-900"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {EVENT_TYPES.map((type) => (
              <span
                key={type}
                className={`rounded-full border px-3 py-1 ${eventClass(type)}`}
              >
                {type}
              </span>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <div className="grid grid-cols-7 bg-zinc-950">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border-r border-zinc-800 p-2 text-center text-[10px] font-black uppercase text-zinc-500 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => openCreate(day)}
                  className={`min-h-28 border-r border-t border-zinc-900 p-2 text-left align-top transition last:border-r-0 hover:bg-red-950/10 ${
                    day.inCurrentMonth
                      ? "bg-zinc-950/80"
                      : "bg-black/50 text-zinc-700"
                  }`}
                >
                  <span
                    className={`mb-2 inline-grid h-7 w-7 place-items-center rounded-full text-xs font-black ${
                      day.isToday
                        ? "bg-red-700 text-white"
                        : day.inCurrentMonth
                        ? "text-zinc-200"
                        : "text-zinc-700"
                    }`}
                  >
                    {day.date.getDate()}
                  </span>

                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => openEdit(event, e)}
                        className={`rounded-lg border p-1.5 text-[10px] leading-4 ${eventClass(
                          event.event_type
                        )}`}
                      >
                        <p className="truncate font-black">{event.title}</p>
                        <p className="opacity-80">
                          {formatTime(event.start_time)}
                        </p>
                      </div>
                    ))}

                    {day.events.length > 3 && (
                      <p className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-zinc-400">
                        +{day.events.length - 3} more
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}