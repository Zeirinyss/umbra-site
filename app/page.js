"use client";

import React, { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { getUserStatus } from "@/lib/getUserStatus";
import { supabase } from "@/lib/supabase";
import { usePresence } from "@/lib/usePresence";
import OnlineMembers from "@/components/OnlineMembers";

export default function Home() {
  const [isApprovedMember, setIsApprovedMember] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);

  usePresence();

  const [settings, setSettings] = useState({
    home_title: "Victory from the shadows.",
    home_description:
      "Umbra Corporation is a private interstellar enterprise built around logistics, security, intelligence, racing, and strategic influence.",
    home_motto: "Victoria ex Umbra",
    home_video_url: "/org-video.mp4",
  });

  useEffect(() => {
    loadStatus();
    loadSettings();
  }, []);

  async function loadStatus() {
    const status = await getUserStatus();

    setIsApprovedMember(!!status.user && status.status === "approved");
  }

  async function loadSettings() {
    const { data, error } = await supabase.from("site_settings").select("*");

    if (error || !data) return;

    const loadedSettings = {};

    data.forEach((item) => {
      loadedSettings[item.id] = item.value;
    });

    setSettings((current) => ({
      ...current,
      ...loadedSettings,
    }));
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

  function renderVideo(url) {
    if (!url) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-500">
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
          title="Umbra Command Broadcast"
        />
      );
    }

    return <video src={url} controls className="h-full w-full object-cover" />;
  }

  return (
    <main className="page-fade relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <OnlineMembers />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.4),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.3),transparent_40%)] opacity-30" />

      <section className="relative border-b border-red-950 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <header className="rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/30 backdrop-blur-xl transition hover:border-red-900">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <a href="/" className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/40">
                  <img src="/logo.png" className="h-10 w-10" alt="Umbra Logo" />
                </div>

                <div>
                  <p className="text-2xl font-black tracking-[0.25em]">
                    UMBRA
                  </p>
                  <p className="text-xs uppercase tracking-[0.35em] text-red-500">
                    Corporation
                  </p>
                </div>
              </a>

              <UserMenu />
            </div>
          </header>

          <div className="grid items-center gap-12 py-24 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-6 inline-block rounded-full border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                RSI Designation: UCOR
              </p>

              <h1 className="text-6xl font-black leading-tight text-white md:text-7xl">
                {settings.home_title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg text-zinc-300">
                {settings.home_description}
              </p>

              <p className="mt-5 text-xl italic text-red-400">
                {settings.home_motto}
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                {!isApprovedMember && (
                  <>
                    <a
                      href="https://robertsspaceindustries.com/en/orgs/UCOR"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-2xl bg-red-700 px-8 py-4 font-black shadow-lg shadow-red-950/40 transition hover:bg-red-600 active:scale-95"
                    >
                      Apply on RSI
                    </a>

                    <a
                      href="/request-access"
                      className="rounded-2xl border border-red-800 px-8 py-4 font-black transition hover:bg-red-950/30 active:scale-95"
                    >
                      Request Access
                    </a>
                  </>
                )}

                <a
                  href="/about"
                  className="rounded-2xl border border-zinc-700 px-8 py-4 font-black transition hover:border-red-900 hover:bg-zinc-900 active:scale-95"
                >
                  Learn More
                </a>

                <a
                  href="https://discord.gg/UNhDdUVCAb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-indigo-700 bg-indigo-900/30 px-8 py-4 font-black text-indigo-300 transition hover:bg-indigo-800/40 active:scale-95"
                >
                  Join Discord
                </a>

                <a
                  href="/media"
                  className="rounded-2xl border border-cyan-800 bg-cyan-900/20 px-8 py-4 font-black text-cyan-300 transition hover:bg-cyan-800/30 active:scale-95"
                >
                  Media Library
                </a>

                {isApprovedMember && (
                  <button
                    onClick={() => setShowAppModal(true)}
                    className="rounded-2xl border border-green-800 px-8 py-4 font-black text-green-300 transition hover:bg-green-950/30 active:scale-95"
                  >
                    Download Android App
                  </button>
                )}
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <StatCard label="Divisions" value="4" />
                <StatCard label="Founded" value="2955" />
                <StatCard label="Command" value="Active" />
              </div>
            </div>

            <div className="rounded-3xl border border-red-900 bg-black/60 p-6 shadow-2xl shadow-red-950/40 transition hover:border-red-700">
              <h2 className="mb-4 text-2xl font-black">
                Umbra Command Broadcast
              </h2>

              <div className="aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                {renderVideo(settings.home_video_url)}
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                Official Umbra operations broadcast.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Victoria ex Umbra
      </footer>

      {showAppModal && isApprovedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-red-900 bg-zinc-950 p-6 text-white shadow-2xl shadow-red-950/40">
            <h2 className="text-3xl font-black">Umbra Android App</h2>

            <p className="mt-3 text-zinc-400">
              This application is only available for Android mobile devices.
            </p>

            <div className="mt-6 space-y-5 text-sm text-zinc-300">
              <div>
                <p className="font-bold text-red-400">To Install</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Download the APK file by pressing the download button.</li>
                  <li>Allow installation from third-party apps if your phone asks.</li>
                  <li>Open the APK file after it finishes downloading.</li>
                  <li>If prompted, allow installation through your file manager.</li>
                  <li>
                    Your phone may warn about unknown sources because it is not
                    from the Play Store. This is normal for APK installs.
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-bold text-red-400">To Update</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Download the newest APK from this page.</li>
                  <li>Open the file from your downloads or file manager.</li>
                  <li>Tap Update when prompted.</li>
                  <li>Do not uninstall the app first unless instructed.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="/downloads/umbracorp.apk"
                download
                className="rounded-xl bg-red-700 px-5 py-3 text-center font-black hover:bg-red-600"
              >
                Download APK
              </a>

              <button
                onClick={() => setShowAppModal(false)}
                className="rounded-xl border border-zinc-800 px-5 py-3 font-black hover:bg-zinc-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/60 p-4 text-center shadow-xl shadow-red-950/10 transition hover:scale-[1.02] hover:border-red-900">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}