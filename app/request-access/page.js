"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequestAccess() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    email: "",
    rsi_handle: "",
    discord: "",
    division: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    setUser(currentUser);

    if (currentUser?.email) {
      setForm((prev) => ({
        ...prev,
        email: currentUser.email,
      }));
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitRequest(e) {
    e.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("You must create an account and log in before requesting access.");
      return;
    }

    const { error } = await supabase.from("member_requests").insert([
      {
        user_id: user.id,
        email: form.email,
        rsi_handle: form.rsi_handle,
        discord: form.discord,
        division: form.division,
        status: "pending",
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetch("/api/request-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setMessage("Request submitted. Await approval.");

    setForm({
      email: user.email || "",
      rsi_handle: "",
      discord: "",
      division: "",
    });
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <form
        onSubmit={submitRequest}
        className="w-full max-w-lg rounded-2xl border border-red-900 bg-zinc-950 p-8"
      >
        <h1 className="text-3xl font-black mb-3">Request Access</h1>

        <p className="mb-6 text-zinc-400">
          Create an account, log in, then submit your access request.
        </p>

        {!user && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
            You must be logged in before requesting access.
            <a href="/login" className="ml-2 font-bold underline">
              Login here
            </a>
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
          className="w-full p-3 mb-4 bg-black border border-zinc-800 rounded"
          required
          readOnly={!!user?.email}
        />

        <input
          placeholder="RSI Handle"
          value={form.rsi_handle}
          onChange={(e) => updateForm("rsi_handle", e.target.value)}
          className="w-full p-3 mb-4 bg-black border border-zinc-800 rounded"
          required
        />

        <input
          placeholder="Discord"
          value={form.discord}
          onChange={(e) => updateForm("discord", e.target.value)}
          className="w-full p-3 mb-4 bg-black border border-zinc-800 rounded"
        />

        <input
          placeholder="Division"
          value={form.division}
          onChange={(e) => updateForm("division", e.target.value)}
          className="w-full p-3 mb-6 bg-black border border-zinc-800 rounded"
        />

        <button
          disabled={!user}
          className="w-full bg-red-700 p-3 rounded font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Request
        </button>

        {message && <p className="mt-4 text-sm text-red-300">{message}</p>}
      </form>
    </main>
  );
}