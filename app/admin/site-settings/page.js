"use client";

import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

const defaultSettings = {
  home_title: "Victory from the shadows.",
  home_description:
    "Umbra Corporation is a private interstellar enterprise built around logistics, security, intelligence, racing, and strategic influence.",
  home_motto: "Victoria ex Umbra",
  home_video_url: "/org-video.mp4",

  about_title: "Built in shadow. Directed by purpose.",
  about_text:
    "Umbra Corporation is an autonomous, self-governing organization built around secrecy, profit, unity, and strategic control. Members operate across specialized divisions to secure resources, gather intelligence, enforce corporate interests, and compete at the highest level.",

  history_origin:
    "Founded during a turbulent economic period as frontier systems became increasingly unstable.",
  history_opportunity:
    "Where others saw chaos, Umbra identified structure, leverage, and strategic advantage.",
  history_operations:
    "Umbra began as a grey ops assault team specializing in covert operations and tactical reconnaissance.",

  manifesto_origin:
    "Born in the void between stars, Umbra was not built on ideals. It was built on necessity.",
  manifesto_vision:
    "To command the frontier from the shadows and control the flow of information, resources, and power.",
  manifesto_structure:
    "Umbra operates through dedicated divisions, each serving a vital role in the corporate machine.",
  manifesto_code:
    "Secrecy is Strength. Profit is Power. Unity in Shadow. Adapt. Endure. Overcome.",

  charter_article_1:
    "Umbra Corporation is a private interstellar enterprise operating across the UEE and beyond.",
  charter_article_2:
    "Umbra exists to expand influence, acquire assets, provide security, and ensure member advancement.",
  charter_article_3:
    "Umbra is divided into primary divisions under the authority of the Board of Directors.",
};

export default function SiteSettingsPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Loading settings...");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(defaultSettings);

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

    await loadSettings();
  }

  async function loadSettings() {
    const { data, error } = await supabase.from("site_settings").select("*");

    if (error) {
      setMessage(error.message);
      return;
    }

    const loaded = {};

    data?.forEach((item) => {
      loaded[item.id] = item.value;
    });

    setForm((current) => ({
      ...current,
      ...loaded,
    }));

    setMessage("");
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving settings...");

    const rows = Object.entries(form).map(([id, value]) => ({
      id,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Site settings saved.");
    setSaving(false);
  }

  function getYouTubeEmbed(url) {
    if (!url) return "";

    if (url.includes("youtube.com/watch?v=")) {
      const id = url.split("watch?v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }

    if (url.includes("youtube.com/embed/")) {
      return url;
    }

    return "";
  }

  function renderVideoPreview(url) {
    if (!url) {
      return (
        <div className="flex h-full w-full items-center justify-center text-zinc-500">
          No video selected.
        </div>
      );
    }

    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

    if (isYouTube) {
      return (
        <iframe
          src={getYouTubeEmbed(url)}
          className="h-full w-full"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={url}
        controls
        className="h-full w-full object-cover"
      />
    );
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
            Site Settings
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Edit homepage and about page content without changing code. Homepage
            video supports local MP4 paths and YouTube links.
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

      <form
        onSubmit={saveSettings}
        className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <section className="space-y-6">
          <Panel eyebrow="Homepage" title="Home Page Content">
            <InputField
              label="Homepage Title"
              value={form.home_title}
              onChange={(value) => updateForm("home_title", value)}
            />

            <TextareaField
              label="Homepage Description"
              value={form.home_description}
              onChange={(value) => updateForm("home_description", value)}
            />

            <InputField
              label="Motto Text"
              value={form.home_motto}
              onChange={(value) => updateForm("home_motto", value)}
            />

            <InputField
              label="Video URL"
              value={form.home_video_url}
              onChange={(value) => updateForm("home_video_url", value)}
              helper="/org-video.mp4 or a YouTube link"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-red-700 p-3 font-black hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Site Settings"}
            </button>
          </Panel>

          <Panel eyebrow="About" title="About Page Content">
            <InputField
              label="About Title"
              value={form.about_title}
              onChange={(value) => updateForm("about_title", value)}
            />

            <TextareaField
              label="About Text"
              value={form.about_text}
              onChange={(value) => updateForm("about_text", value)}
            />
          </Panel>

          <Panel eyebrow="History" title="History Cards">
            <TextareaField
              label="Origin"
              value={form.history_origin}
              onChange={(value) => updateForm("history_origin", value)}
            />

            <TextareaField
              label="Opportunity"
              value={form.history_opportunity}
              onChange={(value) => updateForm("history_opportunity", value)}
            />

            <TextareaField
              label="Early Operations"
              value={form.history_operations}
              onChange={(value) => updateForm("history_operations", value)}
            />
          </Panel>

          <Panel eyebrow="Manifesto" title="Manifesto Cards">
            <TextareaField
              label="I. Our Origin"
              value={form.manifesto_origin}
              onChange={(value) => updateForm("manifesto_origin", value)}
            />

            <TextareaField
              label="II. Our Vision"
              value={form.manifesto_vision}
              onChange={(value) => updateForm("manifesto_vision", value)}
            />

            <TextareaField
              label="III. Our Structure"
              value={form.manifesto_structure}
              onChange={(value) => updateForm("manifesto_structure", value)}
            />

            <TextareaField
              label="IV. Our Code"
              value={form.manifesto_code}
              onChange={(value) => updateForm("manifesto_code", value)}
            />
          </Panel>

          <Panel eyebrow="Charter" title="Charter Articles">
            <TextareaField
              label="Article I — Name and Nature"
              value={form.charter_article_1}
              onChange={(value) => updateForm("charter_article_1", value)}
            />

            <TextareaField
              label="Article II — Purpose"
              value={form.charter_article_2}
              onChange={(value) => updateForm("charter_article_2", value)}
            />

            <TextareaField
              label="Article III — Structure"
              value={form.charter_article_3}
              onChange={(value) => updateForm("charter_article_3", value)}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-red-700 p-3 font-black hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Site Settings"}
            </button>
          </Panel>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/5">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
              Homepage Preview
            </p>

            <h2 className="mt-3 text-4xl font-black">{form.home_title}</h2>

            <p className="mt-4 leading-7 text-zinc-400">
              {form.home_description}
            </p>

            <p className="mt-4 text-xl italic text-red-400">
              {form.home_motto}
            </p>
          </section>

          <section className="rounded-3xl border border-red-900 bg-black/60 p-6 shadow-2xl shadow-red-950/20">
            <h2 className="mb-4 text-2xl font-black">Video Preview</h2>

            <div className="aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              {renderVideoPreview(form.home_video_url)}
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/5">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
              About Preview
            </p>

            <h2 className="mt-3 text-4xl font-black">{form.about_title}</h2>

            <p className="mt-4 leading-7 text-zinc-400">{form.about_text}</p>
          </section>
        </aside>
      </form>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Admin Settings
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
              Admin Settings
            </p>
          </div>
        </a>

        <UserMenu />
      </div>
    </header>
  );
}

function Panel({ eyebrow, title, children }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-black/60 p-6 shadow-2xl shadow-red-950/5">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
}

function InputField({ label, value, onChange, helper }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-400">{label}</span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
      />

      {helper && <span className="text-xs text-zinc-500">{helper}</span>}
    </label>
  );
}

function TextareaField({ label, value, onChange }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-zinc-400">{label}</span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-28 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
      />
    </label>
  );
}