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
      // 🔴 Get iCal events
      const res = await fetch("/api/calendar", { cache: "no-store" });
      const data = await res.json();
      const icalEvents = data.events || [];

      // 🔴 Get Supabase events
      const { data: dbEvents } = await supabase
        .from("events")
        .select("*");

      const formattedDbEvents = (dbEvents || []).map((e) => ({
        title: e.title,
        start: e.start_time,
        end: e.end_time,
        location: e.location,
      }));

      // 🔥 Merge both
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

        <h1 className="mb-6 text-3xl font-black">{monthName}</h1>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* CALENDAR */}
          <div className="rounded-2xl border border-zinc-800 bg-black">
            <div className="grid grid-cols-7 bg-zinc-950">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="p-2 text-center text-xs text-zinc-500">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => (
                <div key={i} className="min-h-24 border p-2 border-zinc-900">
                  <p className="text-sm">{day.date.getDate()}</p>

                  {day.events.map((event, idx) => (
                    <div key={idx} className="text-xs text-red-400">
                      {event.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* SIDE */}
          <aside className="rounded-2xl border border-zinc-800 bg-black p-4">
            <h2 className="text-xl font-bold">Upcoming</h2>

            {upcomingEvents.map((event, i) => (
              <div key={i} className="mt-3">
                <p className="font-bold">{event.title}</p>
                <p className="text-sm text-red-400">
                  {formatEastern(event.start)}
                </p>
              </div>
            ))}
          </aside>

        </div>
      </section>
    </main>
  );
}