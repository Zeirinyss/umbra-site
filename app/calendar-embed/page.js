"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

const EMBED_KEY = "umbra-calendar-2026-private-key";

function formatEastern(date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEasternTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CalendarEmbedPage() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("Loading calendar...");
  const [allowed, setAllowed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");

    if (key !== EMBED_KEY) {
      setMessage("Access denied.");
      return;
    }

    setAllowed(true);
    loadEvents();

    const unsubscribe = subscribeToTables(
      "calendar-embed-live",
      ["events"],
      () => {
        loadEvents();
      }
    );

    return unsubscribe;
  }, []);

  async function loadEvents() {
    try {
      const res = await fetch(`/api/calendar?t=${Date.now()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      const icalEvents = data.events || [];

      const { data: dbEvents } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      const formattedDbEvents = (dbEvents || []).map((e) => ({
        title: e.title,
        description: e.description,
        start: e.start_time,
        end: e.end_time,
        location: e.location,
      }));

      const combined = [...icalEvents, ...formattedDbEvents];

      setEvents(combined);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("Failed to load calendar.");
    }
  }

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => new Date(e.start) >= now).slice(0, 6);
  }, [events]);

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
        const d = new Date(event.start);
        return (
          d.getFullYear() === day.getFullYear() &&
          d.getMonth() === day.getMonth() &&
          d.getDate() === day.getDate()
        );
      });

      days.push({
        date: day,
        inCurrentMonth: day.getMonth() === month,
        events: dayEvents,
      });
    }

    return days;
  }, [currentDate, events]);

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

  if (!allowed) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-red-400">{message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-4">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={previousMonth}
            className="rounded-xl border border-zinc-800 px-3 py-2 text-sm font-bold hover:bg-zinc-900"
          >
            Prev
          </button>

          <h1 className="text-center text-2xl font-black">{monthName}</h1>

          <button
            onClick={nextMonth}
            className="rounded-xl border border-zinc-800 px-3 py-2 text-sm font-bold hover:bg-zinc-900"
          >
            Next
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-zinc-800 bg-black">
            <div className="grid grid-cols-7 bg-zinc-950">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="p-2 text-center text-xs text-zinc-500">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => (
                <div key={i} className="min-h-24 border border-zinc-900 p-2">
                  <p
                    className={`text-sm ${
                      day.inCurrentMonth ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {day.date.getDate()}
                  </p>

                  {day.events.map((event, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="mt-1 block w-full rounded bg-red-950/60 px-2 py-1 text-left text-xs text-red-300 hover:bg-red-900/70"
                    >
                      <p className="truncate font-bold">{event.title}</p>
                      <p className="text-[10px] text-zinc-400">
                        {formatEasternTime(event.start)}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-black p-4">
            <h2 className="text-xl font-bold">Upcoming</h2>

            {upcomingEvents.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No upcoming events.</p>
            ) : (
              upcomingEvents.map((event, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="mt-3 block w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-left hover:border-red-900"
                >
                  <p className="font-bold">{event.title}</p>
                  <p className="text-sm text-red-400">
                    {formatEastern(event.start)}
                  </p>
                </button>
              ))
            )}
          </aside>
        </div>
      </section>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-900 bg-zinc-950 p-5 text-white shadow-2xl shadow-red-950/40">
            <h2 className="text-2xl font-black">{selectedEvent.title}</h2>

            <p className="mt-3 text-sm text-red-400">
              {formatEastern(selectedEvent.start)}
            </p>

            {selectedEvent.end && (
              <p className="mt-1 text-sm text-zinc-500">
                Ends: {formatEastern(selectedEvent.end)}
              </p>
            )}

            {selectedEvent.location && (
              <p className="mt-3 text-sm text-zinc-300">
                <b>Location:</b> {selectedEvent.location}
              </p>
            )}

            {selectedEvent.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-400">
                {selectedEvent.description}
              </p>
            )}

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="mt-6 w-full rounded-xl bg-red-700 p-3 font-bold hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}