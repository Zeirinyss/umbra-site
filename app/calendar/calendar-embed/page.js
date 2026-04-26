"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key");

    if (key !== EMBED_KEY) {
      setMessage("Access denied.");
      return;
    }

    setAllowed(true);
    loadEvents();
  }, []);

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => new Date(event.start) >= now).slice(0, 6);
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
        const eventDate = new Date(event.start);
        return (
          eventDate.getFullYear() === day.getFullYear() &&
          eventDate.getMonth() === day.getMonth() &&
          eventDate.getDate() === day.getDate()
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

  async function loadEvents() {
    try {
      const res = await fetch("/api/calendar", { cache: "no-store" });
      const data = await res.json();

      setEvents(data.events || []);
      setMessage("");
    } catch {
      setMessage("Failed to load calendar.");
    }
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
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
              Umbra Corporation
            </p>
            <h1 className="mt-2 text-3xl font-black">{monthName}</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={previousMonth} className="rounded-lg border border-zinc-800 px-3 py-2 hover:bg-zinc-900">
              Prev
            </button>
            <button onClick={goToday} className="rounded-lg bg-red-700 px-3 py-2 font-bold hover:bg-red-600">
              Today
            </button>
            <button onClick={nextMonth} className="rounded-lg border border-zinc-800 px-3 py-2 hover:bg-zinc-900">
              Next
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-200">
            {message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
            <div className="grid grid-cols-7 bg-zinc-950">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="border-r border-zinc-800 p-2 text-center text-xs font-black uppercase text-zinc-500 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-28 border-r border-t border-zinc-900 p-2 last:border-r-0 ${
                    day.inCurrentMonth ? "bg-zinc-950/80" : "bg-black/50 text-zinc-700"
                  }`}
                >
                  <p className="mb-2 text-sm font-black">{day.date.getDate()}</p>

                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-red-900 bg-red-950/50 p-2 text-xs"
                        title={`${event.title} - ${formatEastern(event.start)}`}
                      >
                        <p className="truncate font-bold">{event.title}</p>
                        <p className="text-[11px] text-red-200">
                          {formatEasternTime(event.start)}
                        </p>
                      </div>
                    ))}

                    {day.events.length > 3 && (
                      <p className="text-xs text-zinc-500">
                        +{day.events.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-red-500">
              Next Up
            </p>

            <h2 className="mt-2 text-2xl font-black">Upcoming</h2>

            <div className="mt-4 space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-zinc-500">No upcoming events.</p>
              ) : (
                upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <p className="font-black">{event.title}</p>
                    <p className="mt-1 text-sm text-red-400">
                      {formatEastern(event.start)}
                    </p>
                    {event.location && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {event.location}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}