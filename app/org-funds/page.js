"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function OrgFundsPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Loading org funds...");

  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    amount: "",
    note: "",
  });

  const isAdmin = !!role;

  useEffect(() => {
    loadPage();
  }, []);

  const acceptedFunds = useMemo(() => {
    return requests
      .filter((item) => item.status === "accepted")
      .reduce((total, item) => total + Number(item.amount || 0), 0);
  }, [requests]);

  const pendingTotal = useMemo(() => {
    return requests
      .filter((item) => item.status === "pending")
      .reduce((total, item) => total + Number(item.amount || 0), 0);
  }, [requests]);

  const pendingRequests = useMemo(() => {
    return requests.filter((item) => item.status === "pending");
  }, [requests]);

  const acceptedRequests = useMemo(() => {
    return requests.filter((item) => item.status === "accepted");
  }, [requests]);

  async function loadPage() {
    const userStatus = await getUserStatus();

    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setRole(userStatus.role || null);
    setStatus(userStatus.status || "guest");

    if (!userStatus.user) {
      setMessage("You must be logged in to view org funds.");
      return;
    }

    if (userStatus.status !== "approved") {
      setMessage("You must be an approved Umbra member to view org funds.");
      return;
    }

    await fetchRequests();
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("org_fund_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequests(data || []);
    setMessage("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitRequest(event) {
    event.preventDefault();
    setMessage("");

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setMessage("Enter a valid aUEC amount.");
      return;
    }

    const requestedBy = member?.rsi_handle || user?.email || "Unknown Member";

    const { error } = await supabase.from("org_fund_requests").insert([
      {
        amount,
        note: form.note,
        requested_by_name: requestedBy,
        requested_by_id: user.id,
      },
    ]);

    if (error) {
      setMessage(error.message);
      return;
    }

    const discordResponse = await fetch("/api/org-funds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        note: form.note,
        requestedBy,
      }),
    });

    if (!discordResponse.ok) {
      setMessage(
        "Deposit request saved, but Discord notification failed. Check the webhook setup."
      );
    } else {
      setMessage("Deposit request submitted and sent to command.");
    }

    setForm({
      amount: "",
      note: "",
    });

    await fetchRequests();
  }

  async function acceptRequest(id) {
    const { error } = await supabase
      .from("org_fund_requests")
      .update({
        status: "accepted",
        received_by_name: member?.rsi_handle || user?.email || "Umbra Command",
        received_by_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchRequests();
    setMessage("Deposit accepted and added to org funds.");
  }

  async function denyRequest(id) {
    const { error } = await supabase
      .from("org_fund_requests")
      .update({
        status: "denied",
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchRequests();
    setMessage("Deposit request denied.");
  }

  async function deleteRequest(id) {
    if (!confirm("Delete this org funds request?")) return;

    const { error } = await supabase
      .from("org_fund_requests")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchRequests();
    setMessage("Request deleted.");
  }

  function formatAUEC(value) {
    return `${Number(value || 0).toLocaleString()} aUEC`;
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <section className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-zinc-400">{message}</p>
        </section>
      </main>
    );
  }

  if (!user || status !== "approved") {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <Header />

        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-red-900 bg-black/60 p-8 shadow-2xl shadow-red-950/20">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              Umbra Corporation
            </p>

            <h1 className="mt-4 text-3xl font-black">Org Funds Restricted</h1>

            <p className="mt-4 text-zinc-400">{message}</p>

            <a
              href="/login"
              className="mt-6 inline-block rounded-xl bg-red-700 px-5 py-3 font-bold hover:bg-red-600"
            >
              Login
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <section className="border-b border-red-950/70 bg-gradient-to-b from-red-950/30 to-black px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
            Umbra Treasury
          </p>

          <h1 className="mt-3 text-5xl font-black md:text-6xl">
            Org Funds
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Track Umbra Corporation aUEC donations. Members submit deposit
            requests, and command staff confirms them after the in-game transfer
            is received.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <StatCard label="Confirmed Balance" value={formatAUEC(acceptedFunds)} />
            <StatCard label="Pending Requests" value={formatAUEC(pendingTotal)} />
            <StatCard label="Accepted Deposits" value={acceptedRequests.length} />
          </div>
        </div>
      </section>

      {message && (
        <div className="mx-auto mt-6 max-w-7xl px-6">
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
            {message}
          </div>
        </div>
      )}

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-6">
          <Panel
            eyebrow="Treasury"
            title={formatAUEC(acceptedFunds)}
            description="Current confirmed organization balance. Pending requests do not count until accepted."
          />

          <form
            onSubmit={submitRequest}
            className="rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10"
          >
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
              Donation Request
            </p>

            <h2 className="mt-2 text-3xl font-black">Submit Deposit</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Submit the amount you want to donate. Command staff will accept it
              after they receive the aUEC in game.
            </p>

            <div className="mt-6 grid gap-4">
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => updateForm("amount", e.target.value)}
                placeholder="Amount in aUEC"
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              />

              <textarea
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="Notes / reason for donation"
                className="min-h-32 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
              />

              <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
                Submit Deposit Request
              </button>
            </div>
          </form>

          <Panel
            eyebrow="Process"
            title="How it works"
            description="Submit request → send aUEC in game → command confirms → balance updates."
          >
            <div className="mt-5 grid gap-3 text-sm text-zinc-400">
              <Step number="1" text="Member submits a donation request." />
              <Step number="2" text="Member transfers aUEC to the receiver in game." />
              <Step number="3" text="Command staff accepts the request." />
              <Step number="4" text="Confirmed balance updates automatically." />
            </div>
          </Panel>
        </aside>

        <section className="space-y-8">
          <Panel
            eyebrow="Pending"
            title="Donation Requests"
            description="Requests waiting for in-game confirmation."
          >
            {pendingRequests.length === 0 ? (
              <EmptyState text="No pending donation requests." />
            ) : (
              <div className="mt-6 space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isAdmin={isAdmin}
                    formatAUEC={formatAUEC}
                    onAccept={acceptRequest}
                    onDeny={denyRequest}
                    onDelete={deleteRequest}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            eyebrow="Ledger"
            title="Accepted Donations"
            description="Confirmed deposits that count toward the org balance."
          >
            {acceptedRequests.length === 0 ? (
              <EmptyState text="No accepted donations yet." />
            ) : (
              <div className="mt-6 space-y-4">
                {acceptedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isAdmin={isAdmin}
                    formatAUEC={formatAUEC}
                    onAccept={acceptRequest}
                    onDeny={denyRequest}
                    onDelete={deleteRequest}
                  />
                ))}
              </div>
            )}
          </Panel>
        </section>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Org Funds
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-red-950 bg-black px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/10 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <a href="/" className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/30">
            <img
              src="/logo.png"
              alt="Umbra Logo"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div>
            <p className="text-2xl font-black tracking-[0.25em]">UMBRA</p>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-500">
              Treasury
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5 shadow-lg shadow-red-950/5">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-red-400">{value}</p>
    </div>
  );
}

function Panel({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      )}

      {children}
    </section>
  );
}

function RequestCard({
  request,
  isAdmin,
  formatAUEC,
  onAccept,
  onDeny,
  onDelete,
}) {
  const isPending = request.status === "pending";
  const isAccepted = request.status === "accepted";
  const isDenied = request.status === "denied";

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-red-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.25em] ${
              isAccepted
                ? "text-green-400"
                : isDenied
                ? "text-zinc-500"
                : "text-red-400"
            }`}
          >
            {request.status}
          </p>

          <h3 className="mt-2 text-3xl font-black">
            {formatAUEC(request.amount)}
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Requested by{" "}
            <span className="font-bold text-red-400">
              {request.requested_by_name || "Unknown Member"}
            </span>
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-xs text-zinc-600">
            {new Date(request.created_at).toLocaleString()}
          </p>

          {request.received_by_name && (
            <p className="mt-2 text-sm text-zinc-500">
              Accepted by{" "}
              <span className="font-bold text-green-400">
                {request.received_by_name}
              </span>
            </p>
          )}
        </div>
      </div>

      {request.note && (
        <p className="mt-5 border-t border-zinc-900 pt-4 leading-7 text-zinc-400">
          {request.note}
        </p>
      )}

      {isAdmin && (
        <div className="mt-5 flex flex-wrap gap-3">
          {isPending && (
            <>
              <button
                onClick={() => onAccept(request.id)}
                className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold hover:bg-green-600"
              >
                Accept
              </button>

              <button
                onClick={() => onDeny(request.id)}
                className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
              >
                Deny
              </button>
            </>
          )}

          <button
            onClick={() => onDelete(request.id)}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}

function Step({ number, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-red-900 bg-red-950/40 text-sm font-black text-red-300">
        {number}
      </div>

      <p>{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
      {text}
    </p>
  );
}