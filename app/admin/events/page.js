"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminEventsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("admins")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      setMessage("Access denied. You are not listed as an admin.");
      setLoading(false);
      return;
    }

    if (data.role?.toLowerCase() === "owner") {
      setIsAdmin(true);
      setMessage("");
    } else {
      setMessage("Access denied. Owner role required.");
    }

    setLoading(false);
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      return;
    }

    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description,
      location: form.location,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      created_by: user.id,
      discord_sent: false,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage("Event created successfully.");

    setForm({
      title: "",
      description: "",
      location: "",
      start_time: "",
      end_time: "",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        Loading...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        {message}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Create Event</h1>

          <Link
            href="/calendar"
            className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Back to Calendar
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Event title"
            required
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
          />

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
          />

          <label className="block">
            <span className="text-sm text-zinc-400">Start Time</span>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-400">End Time</span>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              required
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-600 p-3 rounded font-bold"
          >
            Create Event
          </button>
        </form>

        {message && (
          <p className="mt-4 text-zinc-300">{message}</p>
        )}
      </div>
    </main>
  );
}