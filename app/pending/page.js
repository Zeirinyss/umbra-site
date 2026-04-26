"use client";

import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-3xl border border-red-900 bg-black/70 p-8 text-center shadow-2xl shadow-red-950/30">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Umbra Corporation
          </p>

          <h1 className="mt-4 text-3xl font-black">Access Pending</h1>

          <p className="mt-4 text-zinc-400">
            Your account exists, but your Umbra member access has not been approved yet.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/request-access"
              className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
            >
              Request Access
            </a>

            <button
              onClick={logout}
              className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}