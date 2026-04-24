"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [declineReasons, setDeclineReasons] = useState({});

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("You must be logged in.");
      return;
    }

    setUser(userData.user);

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("email", userData.user.email)
      .single();

    if (!adminData) {
      setMessage("Access denied.");
      return;
    }

    fetchRequests();
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

  async function approveRequest(req) {
    setMessage("");

    const { error: memberError } = await supabase.from("members").insert([
      {
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

    await supabase
      .from("member_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    setMessage("Request approved.");
    fetchRequests();
  }

  async function declineRequest(req) {
    setMessage("");

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
    fetchRequests();
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-black">Admin Panel</h1>

      <p className="mt-2 text-zinc-400">Logged in as {user?.email}</p>

      <button
        onClick={logout}
        className="mt-4 mb-6 rounded bg-red-700 px-4 py-2"
      >
        Logout
      </button>

      {message && <p className="mb-4 text-red-400">{message}</p>}

      {requests.length === 0 ? (
        <p>No access requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded border border-zinc-700 p-4">
              <p><b>Email:</b> {req.email}</p>
              <p><b>RSI:</b> {req.rsi_handle}</p>
              <p><b>Discord:</b> {req.discord}</p>
              <p><b>Division:</b> {req.division}</p>
              <p><b>Status:</b> {req.status}</p>

              {req.status === "pending" && (
                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => approveRequest(req)}
                    className="rounded bg-green-700 px-4 py-2"
                  >
                    Approve
                  </button>

                  <textarea
                    placeholder="Reason for declining"
                    className="block w-full rounded border border-zinc-700 bg-black p-3"
                    value={declineReasons[req.id] || ""}
                    onChange={(e) =>
                      setDeclineReasons({
                        ...declineReasons,
                        [req.id]: e.target.value,
                      })
                    }
                  />

                  <button
                    onClick={() => declineRequest(req)}
                    className="rounded bg-red-700 px-4 py-2"
                  >
                    Decline & Email Reason
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}