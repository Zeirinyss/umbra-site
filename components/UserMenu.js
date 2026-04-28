"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("guest");
  const [open, setOpen] = useState(false);
 

  const dropdownRef = useRef();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  if (!user) {
    return (
      <div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
        <a href="/about" className="hover:text-red-400">About</a>
        <a href="/leadership" className="hover:text-red-400">Leadership</a>
        <a href="/divisions" className="hover:text-red-400">Divisions</a>
        <a href="/login" className="hover:text-red-400">Login</a>
        <a href="/request-access" className="hover:text-red-400">Request</a>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
        <a href="/pending" className="hover:text-red-400">Pending</a>
        <button onClick={logout} className="hover:text-red-400">Logout</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm font-bold text-zinc-300">
      <a href="/about" className="hover:text-red-400">About</a>
      <a href="/leadership" className="hover:text-red-400">Leadership</a>
      <a href="/divisions" className="hover:text-red-400">Divisions</a>

      <div className="hidden h-5 w-px bg-zinc-700 md:block" />

      <a href="/command-center" className="hover:text-red-400">Command Center</a>
      <a href="/events" className="hover:text-red-400">Calendar</a>
      <a href="/members" className="hover:text-red-400">Members</a>
      <a href="/fleet" className="hover:text-red-400">Fleet</a>
      <a href="/suggestions" className="hover:text-red-400">Suggestions</a>
      <a
  href="https://umbracorp-shop.fourthwall.com/"
  target="_blank"
  rel="noopener noreferrer"
  className="hover:text-red-400"
>
  Store
</a>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-red-900 px-3 py-1 text-red-300 hover:bg-red-950/30"
        >
          {member?.rsi_handle || user.email}
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-800 bg-black shadow-xl">
            <a
              href={member?.id ? `/members/${member.id}` : "/pending"}
              className="block px-4 py-2 hover:bg-zinc-900"
            >
              Profile
            </a>

            <a
              href="/my-fleet"
              className="block px-4 py-2 hover:bg-zinc-900"
            >
              My Fleet
            </a>

            <a
              href="/org-funds"
              className="block px-4 py-2 hover:bg-zinc-900"
            >
              Org Funds
            </a>

            {role && (
              <a
                href="/admin/site-settings"
                className="block px-4 py-2 hover:bg-zinc-900 text-red-400"
              >
                Site Settings
              </a>
            )}

            {role && (
              <a
                href="/admin/leadership"
                className="block px-4 py-2 hover:bg-zinc-900 text-red-400"
              >
                Leadership Editor
              </a>
            )}

            {role && (
              <a
                href="/admin"
                className="block px-4 py-2 hover:bg-zinc-900"
              >
                Admin
              </a>
            )}

            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}