"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    if (!currentUser) {
      setMessage("You must be logged in.");
      return;
    }

    setUser(currentUser);

    const { data: memberData } = await supabase
      .from("members")
      .select("*")
      .eq("email", currentUser.email)
      .maybeSingle();

    setMember(memberData || null);
    setMessage("");
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-5xl font-black">Account</h1>

        {message && (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-red-200">
            {message}
          </div>
        )}

        {!message && (
          <div className="mt-8 rounded-3xl border border-zinc-800 bg-black/60 p-6">
            <h2 className="text-3xl font-black">
              {member?.rsi_handle || "Unapproved Account"}
            </h2>

            <div className="mt-6 grid gap-4 text-zinc-300">
              <p><b>Email:</b> {user?.email}</p>
              <p><b>RSI Handle:</b> {member?.rsi_handle || "Not approved yet"}</p>
              <p><b>Rank:</b> {member?.rank || "N/A"}</p>
              <p><b>Status:</b> {member?.approved ? "Approved Member" : "Not Approved"}</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Home
              </a>

              <a href="/my-fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                My Fleet
              </a>

              <a href="/events" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Calendar
              </a>

              <button
                onClick={logout}
                className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}