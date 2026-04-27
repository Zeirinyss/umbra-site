"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
  fetchEvents();
  checkAdmin();

  const unsubscribe = subscribeToTables(
    "simple-calendar-live",
    ["events"],
    () => {
      fetchEvents();
    }
  );

  return unsubscribe;
}, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("admins")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (data && data.role?.toLowerCase() === "owner") {
      setIsAdmin(true);
    }
  }

  async function fetchEvents() {
    const res = await fetch("/api/calendar");
    const data = await res.json();
    setEvents(data.events || []);
  }

  function handleDayClick(date) {
    if (!isAdmin) return;

    const iso = new Date(date).toISOString().slice(0, 16);

    setForm({
      ...form,
      start_time: iso,
      end_time: iso,
    });

    setSelectedDate(date);
    setShowModal(true);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function createEvent(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      location: form.location,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      created_by: user.id,
      discord_sent: false,
    });

    if (!error) {
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        location: "",
        start_time: "",
        end_time: "",
      });
      fetchEvents();
    } else {
      alert(error.message);
    }
  }

  function generateDays() {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    return days;
  }

  function eventsForDay(date) {
    return events.filter((e) => {
      const eventDate = new Date(e.start).toDateString();
      return eventDate === date.toDateString();
    });
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {generateDays().map((day, i) => (
          <div
            key={i}
            onClick={() => handleDayClick(day)}
            className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800"
          >
            <div className="font-semibold">
              {day.toDateString()}
            </div>

            <div className="mt-2 space-y-1 text-sm text-zinc-300">
              {eventsForDay(day).map((event, idx) => (
                <div key={idx}>
                  • {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Create Event
            </h2>

            <form onSubmit={createEvent} className="space-y-3">
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full p-2 bg-zinc-800 rounded"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 bg-zinc-800 rounded"
              />

              <input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-2 bg-zinc-800 rounded"
              />

              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                className="w-full p-2 bg-zinc-800 rounded"
              />

              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                className="w-full p-2 bg-zinc-800 rounded"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-700 p-2 rounded"
                >
                  Create
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-700 p-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}