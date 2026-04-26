"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function hasRole(requiredRole, userRole) {
  const hierarchy = ["officer", "admin", "owner"];
  return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [message, setMessage] = useState("");
  const [declineReasons, setDeclineReasons] = useState({});

  useEffect(() => {
    loadAdmin();
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((req) => req.status === "pending"),
    [requests]
  );

  const canManageRequests = hasRole("officer", userRole);
  const canManageAdmins = userRole === "owner";

  async function loadAdmin() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) {
      setMessage("You must be logged in.");
      setLoading(false);
      return;
    }

    setUser(currentUser);

    const { data: adminData, error } = await supabase
      .from("admins")
      .select("id, email, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error || !adminData) {
      setMessage("Access denied. Admin permissions required.");
      setLoading(false);
      return;
    }

    const role = adminData.role?.toLowerCase();
    setUserRole(role);

    await fetchRequests();
    await fetchMembers();
    await fetchAdmins();

    setLoading(false);
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("member_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequests(data || []);
  }

  async function fetchMembers() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("approved", true)
      .order("rsi_handle", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMembers(data || []);
  }

  async function fetchAdmins() {
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .order("email", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setAdmins(data || []);
  }

  async function approveRequest(req) {
    setMessage("");

    if (!canManageRequests) {
      setMessage("You do not have permission to approve requests.");
      return;
    }

    if (!req.user_id) {
      setMessage(
        "This request is missing a user_id. Have them log in and resubmit their request."
      );
      return;
    }

    const { error: memberError } = await supabase.from("members").insert([
      {
        user_id: req.user_id,
        email: req.email,
        rsi_handle: req.rsi_handle,
        rank: "Member",
        approved: true,
      },
    ]);

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    const { error: requestError } = await supabase
      .from("member_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    if (requestError) {
      setMessage(requestError.message);
      return;
    }

    setMessage("Request approved.");
    await fetchRequests();
    await fetchMembers();
  }

  async function declineRequest(req) {
    setMessage("");

    if (!canManageRequests) {
      setMessage("You do not have permission to decline requests.");
      return;
    }

    const reason = declineReasons[req.id];

    if (!reason || reason.trim() === "") {
      setMessage("Please enter a decline reason first.");
      return;
    }

    const { error } = await supabase
      .from("member_requests")
      .update({ status: "denied" })
      .eq("id", req.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    const emailResponse = await fetch("/api/decline-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: req.email,
        rsi_handle: req.rsi_handle,
        reason,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      setMessage(emailData.error || "Declined, but email failed.");
      return;
    }

    setMessage("Request declined and email sent.");
    await fetchRequests();
  }

  async function promoteToAdmin(member, role) {
    setMessage("");

    if (!canManageAdmins) {
      setMessage("Only owners can promote admins.");
      return;
    }

    if (!member.user_id) {
      setMessage(
        "This member is missing a user_id. Link their auth user ID before promoting."
      );
      return;
    }

    const alreadyAdmin = admins.some((admin) => admin.id === member.user_id);

    if (alreadyAdmin) {
      setMessage("This member is already an admin.");
      return;
    }

    const { error } = await supabase.from("admins").insert([
      {
        id: member.user_id,
        email: member.email,
        role,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`${member.rsi_handle} promoted to ${role}.`);
    await fetchAdmins();
  }

  async function removeAdmin(admin) {
    setMessage("");

    if (!canManageAdmins) {
      setMessage("Only owners can remove admins.");
      return;
    }

    if (admin.id === user.id) {
      setMessage("You cannot remove your own admin access while logged in.");
      return;
    }

    const confirmed = window.confirm(`Remove admin access for ${admin.email}?`);

    if (!confirmed) return;

    const { error } = await supabase.from("admins").delete().eq("id", admin.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Admin access removed.");
    await fetchAdmins();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-3xl border border-zinc-800 bg-black/70 p-8 text-center">
            <p className="font-bold text-red-400">Checking admin access...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!userRole) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <section className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-900 bg-black/70 p-8 text-center shadow-2xl shadow-red-950/30">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              Umbra Corporation
            </p>

            <h1 className="mt-4 text-3xl font-black">
              Admin Access Restricted
            </h1>

            <p className="mt-4 text-zinc-400">{message}</p>

            <div className="mt-6 flex justify-center gap-3">
              <a
                href="/"
                className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900"
              >
                Home
              </a>

              <button
                onClick={logout}
                className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30"
              >
                Logout
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
                Umbra Corporation
              </p>

              <h1 className="mt-3 text-5xl font-black">Admin Command</h1>

              <p className="mt-3 max-w-2xl text-zinc-400">
                Control panel for member access, admin roles, events, fleet
                tools, and organization actions.
              </p>

              <p className="mt-4 text-sm text-zinc-500">
                Logged in as: {user?.email}
              </p>

              <p className="mt-2 inline-block rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-200">
                {userRole} access
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="/" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Home
              </a>

              <a href="/events" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Calendar
              </a>

              <a href="/fleet" className="rounded-xl border border-zinc-800 px-5 py-3 font-bold hover:bg-zinc-900">
                Org Fleet
              </a>

              <button
                onClick={logout}
                className="rounded-xl border border-red-900 px-5 py-3 font-bold hover:bg-red-950/30"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            <StatCard label="Total Requests" value={requests.length} />
            <StatCard label="Pending Requests" value={pendingRequests.length} />
            <StatCard label="Approved Members" value={members.length} />
            <StatCard label="Admins" value={admins.length} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {message && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-200">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <AdminLink
            title="Calendar Manager"
            description="Create, edit, and delete Umbra calendar events."
            href="/events"
          />

          <AdminLink
            title="Org Fleet"
            description="View fleet strength, member ships, and owner controls."
            href="/fleet"
          />

          <AdminLink
            title="Members"
            description="View approved members and organization roster."
            href="/members"
          />
        </div>

        {canManageAdmins && (
          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/10">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.25em] text-red-500">
                  Admin Management
                </p>
                <h2 className="mt-2 text-3xl font-black">Promote Members</h2>
              </div>

              <div className="space-y-3">
                {members.map((member) => {
                  const alreadyAdmin = admins.some(
                    (admin) => admin.id === member.user_id
                  );

                  return (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                    >
                      <p className="font-black">{member.rsi_handle}</p>
                      <p className="text-sm text-zinc-500">{member.email}</p>

                      {!member.user_id && (
                        <p className="mt-1 text-xs text-red-400">
                          Missing user_id
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => promoteToAdmin(member, "officer")}
                          disabled={alreadyAdmin || !member.user_id}
                          className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Officer
                        </button>

                        <button
                          onClick={() => promoteToAdmin(member, "admin")}
                          disabled={alreadyAdmin || !member.user_id}
                          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Admin
                        </button>

                        <button
                          onClick={() => promoteToAdmin(member, "owner")}
                          disabled={alreadyAdmin || !member.user_id}
                          className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Owner
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/10">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.25em] text-red-500">
                  Admin Management
                </p>
                <h2 className="mt-2 text-3xl font-black">Current Admins</h2>
              </div>

              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-black">{admin.email}</p>
                      <p className="text-sm text-red-400">{admin.role}</p>
                    </div>

                    <button
                      onClick={() => removeAdmin(admin)}
                      disabled={admin.id === user.id}
                      className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {admin.id === user.id ? "Current User" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/10">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.25em] text-red-500">
              Access Requests
            </p>
            <h2 className="mt-2 text-3xl font-black">Member Requests</h2>
          </div>

          {requests.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
              No access requests found.
            </p>
          ) : (
            <div className="grid gap-5">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black">
                      {req.rsi_handle || "Unknown RSI Handle"}
                    </h3>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                        req.status === "pending"
                          ? "border-yellow-800 bg-yellow-950/40 text-yellow-200"
                          : req.status === "approved"
                          ? "border-green-800 bg-green-950/40 text-green-200"
                          : "border-red-900 bg-red-950/40 text-red-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-zinc-400 md:grid-cols-2">
                    <p>
                      <span className="font-bold text-zinc-200">Email:</span>{" "}
                      {req.email}
                    </p>

                    <p>
                      <span className="font-bold text-zinc-200">Discord:</span>{" "}
                      {req.discord || "N/A"}
                    </p>

                    <p>
                      <span className="font-bold text-zinc-200">Division:</span>{" "}
                      {req.division || "N/A"}
                    </p>

                    <p>
                      <span className="font-bold text-zinc-200">User ID:</span>{" "}
                      {req.user_id || "Missing"}
                    </p>
                  </div>

                  {req.status === "pending" && canManageRequests && (
                    <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => approveRequest(req)}
                          className="rounded-xl bg-green-700 px-5 py-3 font-bold hover:bg-green-600"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => declineRequest(req)}
                          className="rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
                        >
                          Decline & Email Reason
                        </button>
                      </div>

                      <textarea
                        placeholder="Reason for declining"
                        className="min-h-24 w-full rounded-xl border border-zinc-800 bg-black p-3 outline-none focus:border-red-700"
                        value={declineReasons[req.id] || ""}
                        onChange={(e) =>
                          setDeclineReasons({
                            ...declineReasons,
                            [req.id]: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-red-400">{value}</p>
    </div>
  );
}

function AdminLink({ title, description, href }) {
  return (
    <a
      href={href}
      className="rounded-3xl border border-zinc-800 bg-black/60 p-5 transition hover:border-red-900 hover:bg-zinc-950"
    >
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </a>
  );
}