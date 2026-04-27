"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-80 space-y-5 rounded-2xl border border-red-900 bg-zinc-900 p-6 shadow-2xl shadow-red-950/30">
        <h1 className="text-center text-2xl font-black">Umbra Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border border-zinc-700 bg-black p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-zinc-700 bg-black p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full rounded-lg bg-red-600 p-2 font-bold"
        >
          Login
        </button>

        <button
          onClick={() => router.push("/create-account")}
          className="w-full rounded-lg bg-zinc-700 p-2 font-bold"
        >
          Create Account
        </button>

        {message && (
          <p className="text-sm text-red-400 text-center">{message}</p>
        )}
      </div>
    </main>
  );
}