"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreateAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rsiHandle, setRsiHandle] = useState("");
  const [discord, setDiscord] = useState("");
  const [division, setDivision] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignup() {
    setMessage("");

    if (!email || !password || !rsiHandle || !discord || !division) {
      setMessage("Please fill out all fields.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const userId = data.user?.id;

    await supabase.from("member_requests").insert({
      user_id: userId,
      email,
      rsi_handle: rsiHandle,
      discord,
      division,
      status: "pending",
    });

    setMessage("Account created & request submitted!");
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-80 space-y-4 rounded-2xl border border-red-900 bg-zinc-900 p-6">
        <h1 className="text-center text-2xl font-black">Create Account</h1>

        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-black border border-zinc-700 rounded" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 bg-black border border-zinc-700 rounded" />
        <input placeholder="RSI Handle" value={rsiHandle} onChange={(e) => setRsiHandle(e.target.value)} className="w-full p-2 bg-black border border-zinc-700 rounded" />
        <input placeholder="Discord Username" value={discord} onChange={(e) => setDiscord(e.target.value)} className="w-full p-2 bg-black border border-zinc-700 rounded" />

        <select value={division} onChange={(e) => setDivision(e.target.value)} className="w-full p-2 bg-black border border-zinc-700 rounded">
          <option value="">Select Division</option>
          <option value="Main Fleet">Main Fleet</option>
          <option value="Racing">Racing</option>
          <option value="Mining">Mining</option>
          <option value="Security">Security</option>
          <option value="Logistics">Logistics</option>
          <option value="Medical">Medical</option>
        </select>

        <button onClick={handleSignup} className="w-full bg-red-600 p-2 font-bold rounded">
          Create Account & Request Access
        </button>

        {message && <p className="text-red-400 text-center text-sm">{message}</p>}
      </div>
    </main>
  );
}