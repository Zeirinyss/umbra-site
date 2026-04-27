"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToTables } from "@/lib/realtimeRefresh";

const EVENT_TYPES = [
  { value: "operation", label: "Operation" },
  { value: "training", label: "Training" },
  { value: "race", label: "Race" },
  { value: "meeting", label: "Meeting" },
  { value: "social", label: "Social" },
];

function eventStyle(event) {
  if (event.source === "ical") {
    return "border-zinc-700 bg-zinc-900/90 text-zinc-200 hover:border-zinc-500";
  }

  switch (event.event_type) {
    case "training":
      return "border-blue-800 bg-blue-950/70 text-blue-100 hover:border-blue-500";
    case "race":
      return "border-yellow-700 bg-yellow-950/60 text-yellow-100 hover:border-yellow-500";
    case "meeting":
      return "border-purple-800 bg-purple-950/70 text-purple-100 hover:border-purple-500";
    case "social":
      return "border-emerald-800 bg-emerald-950/70 text-emerald-100 hover:border-emerald-500";
    default:
      return "border-red-800 bg-red-950/70 text-red-100 hover:border-red-500";
  }
}

function formatEastern(date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
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

function toDateTimeLocal(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("Checking access...");
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [currentUser, setCurrentUser] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);

  const [attendees, setAttendees] = useState([]);
  const [attendeeMembers, setAttendeeMembers] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [hoverEvent, setHoverEvent] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    event_type: "operation",
    start_time: "",
    end_time: "",
  });

 useEffect(() => {
  loadEvents();

  const unsubscribe = subscribeToTables(
    "events-live",
    ["events", "event_attendees"],
    () => {
      loadEvents();
    }
  );

  return unsubscribe;
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

  const hasJoinedSelectedEvent = useMemo(() => {
    return attendees.some((attendee) => attendee.user_id === currentUser?.id);
  }, [attendees, currentUser]);

  async function loadEvents() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        setMessage("You must be logged in to view the calendar.");
        return;
      }

      setCurrentUser(user);

      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!member || member.approved !== true) {
        setMessage("Access denied. You must be an approved Umbra member.");
        return;
      }

      setCurrentMember(member);

      const { data: adminRow } = await supabase
        .from("admins")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      const adminRole = adminRow?.role?.toLowerCase();
      setIsAdmin(adminRole === "owner" || adminRole === "admin");

      setAllowed(true);
      setMessage("Loading calendar...");

      const icalRes = await fetch("/api/calendar");
      const icalData = await icalRes.json();
      const icalEvents = icalData.events || [];

      const { data: dbEvents, error } = await supabase
        .from("events")
        .select("id, title, description, location, event_type, start_time, end_time")
        .order("start_time", { ascending: true });

      if (error) {
        console.log("Supabase events error:", error.message);
      }

      const supabaseEvents = (dbEvents || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        event_type: event.event_type || "operation",
        start: event.start_time,
        end: event.end_time,
        source: "supabase",
      }));

      const combinedEvents = [...icalEvents, ...supabaseEvents].sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );

      setEvents(combinedEvents);
      await loadAttendeeCounts(supabaseEvents);
      setMessage("");
    } catch (error) {
      console.log("Calendar load error:", error);
      setMessage("Failed to load calendar.");
    }
  }

  async function loadAttendeeCounts(supabaseEvents) {
    const eventIds = supabaseEvents.map((event) => event.id);

    if (eventIds.length === 0) {
      setAttendeeCounts({});
      return;
    }

    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .in("event_id", eventIds);

    if (error) {
      console.log("Attendee count error:", error.message);
      return;
    }

    const counts = {};

    (data || []).forEach((row) => {
      counts[row.event_id] = (counts[row.event_id] || 0) + 1;
    });

    setAttendeeCounts(counts);
  }

  async function loadAttendees(eventId) {
    const { data, error } = await supabase
      .from("event_attendees")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Attendees error:", error.message);
      setAttendees([]);
      setAttendeeMembers([]);
      return;
    }

    const eventAttendees = data || [];
    setAttendees(eventAttendees);

    const userIds = eventAttendees.map((attendee) => attendee.user_id);

    if (userIds.length === 0) {
      setAttendeeMembers([]);
      return;
    }

    const { data: membersData, error: membersError } = await supabase
      .from("members")
      .select("user_id, rsi_handle, email")
      .in("user_id", userIds);

    if (membersError) {
      console.log("Attendee members error:", membersError.message);
      setAttendeeMembers([]);
      return;
    }

    setAttendeeMembers(membersData || []);
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

  function openCreateEvent(day) {
    if (!isAdmin) return;

    const start = new Date(day.date);
    start.setHours(17, 0, 0, 0);

    const end = new Date(day.date);
    end.setHours(21, 0, 0, 0);

    setModalMode("create");
    setSelectedEvent(null);
    setAttendees([]);
    setAttendeeMembers([]);
    setModalMessage("");

    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "operation",
      start_time: toDateTimeLocal(start),
      end_time: toDateTimeLocal(end),
    });

    setShowModal(true);
  }

  function openEvent(event, e) {
    e.stopPropagation();

    setSelectedEvent(event);
    setModalMessage("");
    setAttendees([]);
    setAttendeeMembers([]);

    if (event.source === "supabase") {
      loadAttendees(event.id);
    }

    if (event.source === "supabase" && isAdmin) {
      setModalMode("edit");
      setForm({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        event_type: event.event_type || "operation",
        start_time: toDateTimeLocal(event.start),
        end_time: toDateTimeLocal(event.end),
      });
    } else {
      setModalMode("view");
      setForm({
        title: event.title || "",
        description: event.description || "",
        location: event.location || "",
        event_type: event.event_type || "external",
        start_time: toDateTimeLocal(event.start),
        end_time: event.end ? toDateTimeLocal(event.end) : "",
      });
    }

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedEvent(null);
    setAttendees([]);
    setAttendeeMembers([]);
    setModalMessage("");
    setForm({
      title: "",
      description: "",
      location: "",
      event_type: "operation",
      start_time: "",
      end_time: "",
    });
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function toggleRSVP() {
    if (!selectedEvent?.id || !currentUser?.id) return;

    setModalMessage("");

    if (selectedEvent.source !== "supabase") {
      setModalMessage("RSVP is only available for Umbra-created events.");
      return;
    }

    if (hasJoinedSelectedEvent) {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", selectedEvent.id)
        .eq("user_id", currentUser.id);

      if (error) {
        setModalMessage(error.message);
        return;
      }

      setModalMessage("You left this event.");
    } else {
      const { error } = await supabase.from("event_attendees").insert({
        event_id: selectedEvent.id,
        user_id: currentUser.id,
      });

      if (error) {
        setModalMessage(error.message);
        return;
      }

      setModalMessage("You joined this event.");
    }

    await loadAttendees(selectedEvent.id);
    await loadEvents();
  }

  async function createEvent(e) {
    e.preventDefault();
    setModalMessage("");

    if (!currentUser) {
      setModalMessage("You must be logged in.");
      return;
    }

    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      location: form.location,
      event_type: form.event_type,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      created_by: currentUser.id,
      discord_sent: false,
    });

    if (error) {
      setModalMessage(error.message);
      return;
    }

    closeModal();
    await loadEvents();
  }

  async function updateEvent(e) {
    e.preventDefault();
    setModalMessage("");

    if (!selectedEvent?.id) {
      setModalMessage("No event selected.");
      return;
    }

    const { error } = await supabase
      .from("events")
      .update({
        title: form.title,
        description: form.description,
        location: form.location,
        event_type: form.event_type,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      })
      .eq("id", selectedEvent.id);

    if (error) {
      setModalMessage(error.message);
      return;
    }

    closeModal();
    await loadEvents();
  }

  async function deleteEvent() {
    if (!selectedEvent?.id) {
      setModalMessage("No event selected.");
      return;
    }

    const confirmDelete = window.confirm(
      `Delete "${selectedEvent.title}" from the calendar?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", selectedEvent.id);

    if (error) {
      setModalMessage(error.message);
      return;
    }

    closeModal();
    await loadEvents();
  }

  const isViewOnly = modalMode === "view";
  const isEdit = modalMode === "edit";
  const isCreate = modalMode === "create";

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/40 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Corporation
              </p>

              <h1 className="mt-3 text-5xl font-black">Umbra Calendar</h1>

              <p className="mt-3 max-w-3xl text-zinc-400">
                Approved member event calendar for operations, training, meetings,
                and division activity.
              </p>

              {currentMember && (
                <p className="mt-3 text-sm text-red-400">
                  Logged in as {currentMember.rsi_handle || currentUser?.email}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="rounded-xl border border-zinc-800 bg-black/40 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Home
              </a>

              <a
                href="/members"
                className="rounded-xl border border-zinc-800 bg-black/40 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Members
              </a>

              <a
                href="/fleet"
                className="rounded-xl border border-zinc-800 bg-black/40 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Org Fleet
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-200">
            {message}
          </div>
        )}

        {allowed && !message && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-zinc-800 bg-black/70 p-5 shadow-2xl shadow-red-950/20">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-red-500">
                    Operations Schedule
                  </p>

                  <h2 className="mt-2 text-4xl font-black">{monthName}</h2>

                  {isAdmin && (
                    <p className="mt-2 text-sm text-zinc-500">
                      Click a day to create. Click an event to view, edit, RSVP, or delete.
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={previousMonth}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 font-bold hover:border-red-900 hover:bg-zinc-900"
                  >
                    Prev
                  </button>

                  <button
                    onClick={goToday}
                    className="rounded-xl bg-red-700 px-4 py-2 font-bold shadow-lg shadow-red-950/40 hover:bg-red-600"
                  >
                    Today
                  </button>

                  <button
                    onClick={nextMonth}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 font-bold hover:border-red-900 hover:bg-zinc-900"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-red-800 bg-red-950/60 px-3 py-1 text-red-200">
                  Operation
                </span>
                <span className="rounded-full border border-blue-800 bg-blue-950/60 px-3 py-1 text-blue-200">
                  Training
                </span>
                <span className="rounded-full border border-yellow-700 bg-yellow-950/60 px-3 py-1 text-yellow-200">
                  Race
                </span>
                <span className="rounded-full border border-purple-800 bg-purple-950/60 px-3 py-1 text-purple-200">
                  Meeting
                </span>
                <span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-3 py-1 text-emerald-200">
                  Social
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-300">
                  iCal
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                <div className="grid grid-cols-7 bg-zinc-950">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="border-r border-zinc-800 p-3 text-center text-xs font-black uppercase tracking-widest text-zinc-500 last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      onClick={() => openCreateEvent(day)}
                      className={`relative min-h-40 border-r border-t border-zinc-900 p-3 last:border-r-0 transition ${
                        isAdmin ? "cursor-pointer hover:bg-red-950/10" : ""
                      } ${
                        day.inCurrentMonth
                          ? "bg-zinc-950/80"
                          : "bg-black/50 text-zinc-700"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${
                            day.isToday
                              ? "bg-red-700 text-white shadow-lg shadow-red-950/50"
                              : day.inCurrentMonth
                              ? "text-zinc-200"
                              : "text-zinc-700"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>

                        {day.events.length > 0 && (
                          <span className="rounded-full border border-red-900 bg-red-950/70 px-2 py-1 text-[10px] font-bold text-red-200">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {day.events.slice(0, 3).map((event, eventIndex) => (
                          <div key={eventIndex} className="relative">
                            <button
                              type="button"
                              onClick={(e) => openEvent(event, e)}
                              onMouseEnter={() => setHoverEvent(event)}
                              onMouseLeave={() => setHoverEvent(null)}
                              className={`w-full rounded-xl border p-2 text-left text-xs transition ${eventStyle(event)}`}
                            >
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="truncate font-black">{event.title}</p>
                                <span className="shrink-0 text-[9px] uppercase opacity-70">
                                  {event.source === "supabase"
                                    ? event.event_type || "operation"
                                    : "iCal"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[11px] opacity-80">
                                <span>{formatEasternTime(event.start)}</span>

                                {event.source === "supabase" && (
                                  <span>{attendeeCounts[event.id] || 0} going</span>
                                )}
                              </div>
                            </button>

                            {hoverEvent === event && (
                              <div className="pointer-events-none absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-zinc-700 bg-black p-4 text-left shadow-2xl shadow-red-950/40">
                                <p className="text-sm font-black text-white">
                                  {event.title}
                                </p>
                                <p className="mt-1 text-xs text-red-400">
                                  {formatEastern(event.start)}
                                </p>
                                {event.source === "supabase" && (
                                  <p className="mt-2 text-xs text-zinc-400">
                                    {attendeeCounts[event.id] || 0} attending
                                  </p>
                                )}
                                {event.location && (
                                  <p className="mt-2 text-xs text-zinc-400">
                                    {event.location}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="mt-3 line-clamp-4 text-xs leading-5 text-zinc-300">
                                    {event.description}
                                  </p>
                                )}
                                <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-500">
                                  Click for details
                                </p>
                              </div>
                            )}
                          </div>
                        ))}

                        {day.events.length > 3 && (
                          <p className="rounded-lg border border-zinc-800 bg-black/40 px-2 py-1 text-xs text-zinc-500">
                            +{day.events.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-3xl border border-zinc-800 bg-black/70 p-5 shadow-2xl shadow-red-950/10">
              <p className="text-sm uppercase tracking-[0.25em] text-red-500">
                Next Up
              </p>

              <h2 className="mt-2 text-3xl font-black">Upcoming Events</h2>

              <div className="mt-6 space-y-4">
                {upcomingEvents.length === 0 ? (
                  <p className="text-zinc-500">No upcoming events found.</p>
                ) : (
                  upcomingEvents.map((event, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => openEvent(event, e)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${eventStyle(event)}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black">
                          {event.title || "Untitled Event"}
                        </h3>

                        <span className="rounded-full border border-black/20 px-2 py-1 text-[10px] uppercase opacity-80">
                          {event.source === "supabase"
                            ? event.event_type || "operation"
                            : "iCal"}
                        </span>
                      </div>

                      <p className="text-sm opacity-90">
                        {formatEastern(event.start)}
                      </p>

                      {event.source === "supabase" && (
                        <p className="mt-2 text-sm opacity-80">
                          {attendeeCounts[event.id] || 0} going
                        </p>
                      )}

                      {event.location && (
                        <p className="mt-2 text-sm opacity-70">
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 opacity-75">
                          {event.description}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-red-950/40">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-red-500">
                  {isCreate && "Admin Event Creator"}
                  {isEdit && "Edit Umbra Event"}
                  {isViewOnly && "Event Details"}
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {isCreate && "Create Event"}
                  {isEdit && "Edit Event"}
                  {isViewOnly && selectedEvent?.title}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl border border-zinc-800 bg-black px-4 py-2 font-bold hover:bg-zinc-900"
              >
                X
              </button>
            </div>

            {isViewOnly ? (
              <div className="space-y-4">
                {selectedEvent?.source === "supabase" && (
                  <div className="rounded-2xl border border-red-900 bg-red-950/20 p-4">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="text-sm text-zinc-500">RSVP</p>
                        <p className="mt-1 font-bold text-red-400">
                          {attendees.length} going
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={toggleRSVP}
                        className={`rounded-xl px-5 py-3 font-black ${
                          hasJoinedSelectedEvent
                            ? "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                            : "bg-red-700 text-white hover:bg-red-600"
                        }`}
                      >
                        {hasJoinedSelectedEvent ? "Leave Event" : "Join Event"}
                      </button>
                    </div>

                    {attendeeMembers.length > 0 && (
                      <div className="mt-4 border-t border-red-950 pt-4">
                        <p className="text-sm font-bold text-zinc-300">
                          Attending
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {attendeeMembers.map((member) => (
                            <span
                              key={member.user_id}
                              className="rounded-full border border-zinc-800 bg-black/60 px-3 py-1 text-sm text-zinc-300"
                            >
                              {member.rsi_handle || member.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-500">Time</p>
                  <p className="mt-1 font-bold text-red-400">
                    {formatEastern(selectedEvent?.start)}
                  </p>
                </div>

                {selectedEvent?.location && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                    <p className="text-sm text-zinc-500">Location</p>
                    <p className="mt-1 text-zinc-200">{selectedEvent.location}</p>
                  </div>
                )}

                {selectedEvent?.description && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                    <p className="text-sm text-zinc-500">Description</p>
                    <p className="mt-2 whitespace-pre-line leading-7 text-zinc-300">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {selectedEvent?.source === "ical" && (
                  <p className="rounded-xl border border-zinc-800 bg-black/60 p-3 text-sm text-zinc-500">
                    This event comes from iCal and is view-only.
                  </p>
                )}

                {modalMessage && (
                  <p className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
                    {modalMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl border border-zinc-800 px-5 py-3 font-black hover:bg-zinc-900"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={isEdit ? updateEvent : createEvent} className="space-y-4">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Event title"
                  required
                  className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                />

                <select
                  name="event_type"
                  value={form.event_type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className="min-h-28 w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                />

                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Location"
                  className="w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="text-sm text-zinc-400">Start Time</span>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={form.start_time}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                    />
                  </label>

                  <label>
                    <span className="text-sm text-zinc-400">End Time</span>
                    <input
                      type="datetime-local"
                      name="end_time"
                      value={form.end_time}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3 text-white outline-none focus:border-red-800"
                    />
                  </label>
                </div>

                {isEdit && (
                  <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                    <p className="text-sm text-zinc-500">RSVP Count</p>
                    <p className="mt-1 font-bold text-red-400">
                      {attendees.length} going
                    </p>
                  </div>
                )}

                {modalMessage && (
                  <p className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">
                    {modalMessage}
                  </p>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-red-700 px-5 py-3 font-black hover:bg-red-600"
                  >
                    {isEdit ? "Save Changes" : "Create Event"}
                  </button>

                  {isEdit && (
                    <button
                      type="button"
                      onClick={deleteEvent}
                      className="rounded-xl border border-red-900 bg-red-950/40 px-5 py-3 font-black text-red-200 hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-zinc-800 px-5 py-3 font-black hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}