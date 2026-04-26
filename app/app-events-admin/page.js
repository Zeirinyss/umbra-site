"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppEventsAdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
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

  async function loadPage() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    if (!currentUser) return;

    setUser(currentUser);

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (!adminData) return;

    setIsAdmin(true);
    fetchEvents();
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*");

    setEvents(data || []);
  }

  function openCreate(date) {
    setSelectedDate(date);
    setEditingEvent(null);

    const iso = new Date(date).toISOString().slice(0, 16);

    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "Operation",
      start_time: iso,
      end_time: iso,
    });
  }

  function editEvent(event) {
    setEditingEvent(event);

    setForm({
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      event_type: event.event_type || "Operation",
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
    });
  }

  async function saveEvent(e) {
    e.preventDefault();

    if (editingEvent) {
      await supabase
        .from("events")
        .update(form)
        .eq("id", editingEvent.id);
    } else {
      await supabase.from("events").insert([form]);
    }

    resetForm();
    fetchEvents();
  }

  async function deleteEvent(event) {
    if (!confirm("Delete event?")) return;

    await supabase.from("events").delete().eq("id", event.id);
    fetchEvents();
    resetForm();
  }

  function resetForm() {
    setEditingEvent(null);
    setSelectedDate(null);

    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "Operation",
      start_time: "",
      end_time: "",
    });
  }

  function updateForm(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  function getEventsForDay(date) {
    return events.filter((e) => {
      const d = new Date(e.start_time).toDateString();
      return d === new Date(date).toDateString();
    });
  }

  function generateCalendar() {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }

    return days;
  }

  if (!isAdmin) {
    return <div className="p-6 text-white">Access Denied</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4">
      <h1 className="text-3xl font-black mb-4">Event Admin</h1>

      {/* CALENDAR */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {generateCalendar().map((date) => (
          <div
            key={date}
            onClick={() => openCreate(date)}
            className="border border-zinc-800 p-3 rounded-xl bg-zinc-900"
          >
            <p className="text-sm font-bold">
              {date.toLocaleDateString()}
            </p>

            {getEventsForDay(date).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  editEvent(event);
                }}
                className="mt-2 text-xs bg-red-700 p-1 rounded"
              >
                {event.title}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* FORM */}
      {(selectedDate || editingEvent) && (
        <form onSubmit={saveEvent} className="space-y-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => updateForm("title", e.target.value)}
            className="w-full p-3 bg-zinc-900 rounded"
          />

          <input
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => updateForm("start_time", e.target.value)}
            className="w-full p-3 bg-zinc-900 rounded"
          />

          <input
            type="datetime-local"
            value={form.end_time}
            onChange={(e) => updateForm("end_time", e.target.value)}
            className="w-full p-3 bg-zinc-900 rounded"
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            className="w-full p-3 bg-zinc-900 rounded"
          />

          <button className="bg-red-600 w-full p-3 rounded font-bold">
            Save Event
          </button>

          {editingEvent && (
            <button
              type="button"
              onClick={() => deleteEvent(editingEvent)}
              className="bg-red-900 w-full p-3 rounded font-bold"
            >
              Delete Event
            </button>
          )}
        </form>
      )}
    </main>
  );
}