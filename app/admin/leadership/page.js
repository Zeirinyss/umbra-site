"use client";

import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function AdminLeadershipPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Loading leadership editor...");

  const [leadership, setLeadership] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    handle: "",
    title: "",
    division: "",
    display_order: 0,
  });

  const isAdmin = !!role;

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    const userStatus = await getUserStatus();

    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setRole(userStatus.role || null);
    setStatus(userStatus.status || "guest");

    if (!userStatus.user) {
      setMessage("You must be logged in.");
      return;
    }

    if (!userStatus.role) {
      setMessage("Admin access required.");
      return;
    }

    await fetchLeadership();
  }

  async function fetchLeadership() {
    const { data, error } = await supabase
      .from("leadership")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setLeadership(data || []);
    setMessage("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      handle: "",
      title: "",
      division: "",
      display_order: 0,
    });
  }

  function startEdit(leader) {
    setEditingId(leader.id);
    setForm({
      handle: leader.handle || "",
      title: leader.title || "",
      division: leader.division || "",
      display_order: leader.display_order || 0,
    });
  }

  async function saveLeader(event) {
    event.preventDefault();
    setMessage("");

    if (!form.handle.trim() || !form.title.trim() || !form.division.trim()) {
      setMessage("Handle, title, and division are required.");
      return;
    }

    const payload = {
      handle: form.handle.trim(),
      title: form.title.trim(),
      division: form.division.trim(),
      display_order: Number(form.display_order || 0),
    };

    let error;

    if (editingId) {
      const result = await supabase
        .from("leadership")
        .update(payload)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase.from("leadership").insert([payload]);
      error = result.error;
    }

    if (error) {
      setMessage(error.message);
      return;
    }

    resetForm();
    await fetchLeadership();
    setMessage(editingId ? "Leadership member updated." : "Leadership member added.");
  }

  async function deleteLeader(id) {
    if (!confirm("Delete this leadership member?")) return;

    const { error } = await supabase.from("leadership").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await fetchLeadership();
    setMessage("Leadership member deleted.");
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

  if (!user || !isAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <Header />

        <section className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-3xl border border-red-900 bg-black/60 p-8 shadow-2xl shadow-red-950/20">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">
              Umbra Corporation
            </p>

            <h1 className="mt-4 text-3xl font-black">Admin Access Required</h1>

            <p className="mt-4 text-zinc-400">{message}</p>
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
            Admin
          </p>

          <h1 className="mt-3 text-5xl font-black md:text-6xl">
            Leadership Editor
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Add, edit, delete, and reorder Umbra leadership members shown on the
            public Leadership page.
          </p>

          {member && (
            <p className="mt-4 text-sm text-red-400">
              Signed in as {member.rsi_handle}
            </p>
          )}
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
        <form
          onSubmit={saveLeader}
          className="h-fit rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10"
        >
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            {editingId ? "Edit Member" : "Add Member"}
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {editingId ? "Update Leadership" : "New Leadership"}
          </h2>

          <div className="mt-6 grid gap-4">
            <InputField
              label="RSI Handle / Name"
              value={form.handle}
              onChange={(value) => updateForm("handle", value)}
            />

            <InputField
              label="Title"
              value={form.title}
              onChange={(value) => updateForm("title", value)}
            />

            <InputField
              label="Division"
              value={form.division}
              onChange={(value) => updateForm("division", value)}
            />

            <InputField
              label="Display Order"
              type="number"
              value={form.display_order}
              onChange={(value) => updateForm("display_order", value)}
            />

            <button className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600">
              {editingId ? "Save Changes" : "Add Leader"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-zinc-800 p-3 font-black hover:bg-zinc-900"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <section>
          <div className="mb-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
              Current
            </p>

            <h2 className="mt-2 text-3xl font-black">Leadership Roster</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Lower display order appears first.
            </p>
          </div>

          {leadership.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
              No leadership members added yet.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {leadership.map((leader) => (
                <article
                  key={leader.id}
                  className="rounded-3xl border border-zinc-800 bg-black/60 p-6 transition hover:border-red-900"
                >
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-red-500">
                    Order {leader.display_order || 0}
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    {leader.handle}
                  </h3>

                  <p className="mt-2 text-red-400">{leader.title}</p>

                  <p className="mt-3 text-sm text-zinc-500">
                    {leader.division}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => startEdit(leader)}
                      className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteLeader(leader.id)}
                      className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-900/50"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Leadership Admin
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
              Leadership Admin
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-400">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
      />
    </label>
  );
}