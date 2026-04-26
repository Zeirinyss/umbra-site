"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("guest");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const userStatus = await getUserStatus();

    setStatus(userStatus.status);
    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setRole(userStatus.role || null);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // 🔓 GUEST
  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <a href="/login" className="hover:text-red-400">Login</a>
        <a href="/request-access" className="hover:text-red-400">Request</a>
      </div>
    );
  }

  // ⏳ PENDING
  if (status === "pending") {
    return (
      <div className="flex items-center gap-3">
        <a href="/pending" className="hover:text-red-400">Pending</a>
        <button onClick={logout} className="hover:text-red-400">Logout</button>
      </div>
    );
  }

  // ✅ APPROVED
  return (
    <div className="flex items-center gap-4">
      <a href="/events" className="hover:text-red-400">Calendar</a>
      <a href="/members" className="hover:text-red-400">Members</a>
      <a href="/fleet" className="hover:text-red-400">Fleet</a>
      <a href="/my-fleet" className="hover:text-red-400">My Fleet</a>

      {role && (
        <a href="/admin" className="hover:text-red-400">Admin</a>
      )}

      <a
        href={member?.id ? `/members/${member.id}` : "/pending"}
        className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950/30"
      >
        {member?.rsi_handle || user.email}
      </a>

      <button
        onClick={logout}
        className="rounded-lg border border-zinc-800 px-3 py-1 hover:bg-zinc-900"
      >
        Logout
      </button>
    </div>
  );
}