"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      // 🔥 Send to admin panel instead of fleet
      window.location.href = "/admin";
    }
  }

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Account created. You can now log in.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-zinc-900 p-6 rounded w-80 space-y-4 border border-red-900">
        <h1 className="text-2xl font-black text-center">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 bg-black border border-zinc-700 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 bg-black border border-zinc-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-red-600 p-2 rounded"
        >
          Login
        </button>

        <button
          onClick={handleSignup}
          className="w-full bg-zinc-700 p-2 rounded"
        >
          Create Account
        </button>

        {message && <p className="text-sm text-red-400">{message}</p>}
      </div>
    </main>
  );
}