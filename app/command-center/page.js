"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";
import { subscribeToTables } from "@/lib/realtimeRefresh";

export default function CommandCenterPage() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState("loading");

  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("Loading command center...");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = !!role;

  useEffect(() => {
  loadPage();

  const unsubscribe = subscribeToTables(
    "command-center-live",
    ["command_posts"],
    () => {
      fetchPosts();
    }
  );

  return unsubscribe;
}, []);

  useEffect(() => {
    if (status !== "approved") return;

    const channel = supabase
      .channel("command-posts-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "command_posts",
        },
        (payload) => {
          setPosts((current) => [payload.new, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  const totalPosts = useMemo(() => posts.length, [posts]);

  async function loadPage() {
    const userStatus = await getUserStatus();

    setUser(userStatus.user || null);
    setMember(userStatus.member || null);
    setRole(userStatus.role || null);
    setStatus(userStatus.status || "guest");

    if (!userStatus.user) {
      setMessage("You must be logged in to view the command center.");
      return;
    }

    if (userStatus.status !== "approved") {
      setMessage("You must be an approved Umbra member to view the command center.");
      return;
    }

    await fetchPosts();
  }

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("command_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setMessage(error.message);
      return;
    }

    setPosts(data || []);
    setMessage("");
  }

  async function createPost(event) {
    event.preventDefault();
    setMessage("");

    if (!canPost) {
      setMessage("Only command staff can post announcements.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setMessage("Title and content are required.");
      return;
    }

    setPosting(true);

    const { error } = await supabase.from("command_posts").insert([
      {
        title: title.trim(),
        content: content.trim(),
        author: member?.rsi_handle || user?.email || "Umbra Command",
      },
    ]);

    if (error) {
      setMessage(error.message);
      setPosting(false);
      return;
    }

    setTitle("");
    setContent("");
    setPosting(false);
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

            <h1 className="mt-4 text-3xl font-black">
              Command Center Restricted
            </h1>

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
            Umbra Corporation
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-6xl">
            Command Center
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            Members-only operations hub for command announcements, live updates,
            division notices, race alerts, and organization-wide information.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <StatCard label="Status" value="Live" />
            <StatCard label="Posts" value={totalPosts} />
            <StatCard label="Access" value="Members" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10">
            <h2 className="text-2xl font-black">Command Access</h2>

            <div className="mt-5 space-y-3 text-sm text-zinc-400">
              <p>
                Signed in as:{" "}
                <span className="font-bold text-zinc-200">
                  {member?.rsi_handle || user?.email}
                </span>
              </p>

              <p>
                Posting Permission:{" "}
                <span className={canPost ? "font-bold text-red-400" : "font-bold text-zinc-500"}>
                  {canPost ? "Command Staff" : "View Only"}
                </span>
              </p>
            </div>
          </div>

          {canPost && (
            <form
              onSubmit={createPost}
              className="rounded-3xl border border-red-950/80 bg-black/60 p-6 shadow-2xl shadow-red-950/10"
            >
              <h2 className="text-2xl font-black">Post Announcement</h2>

              <p className="mt-2 text-sm text-zinc-500">
                This will appear live for all members currently in the command center.
              </p>

              {message && (
                <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-200">
                  {message}
                </div>
              )}

              <div className="mt-6 grid gap-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Announcement title"
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                />

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write command update..."
                  className="min-h-40 rounded-xl border border-zinc-800 bg-zinc-950 p-3 outline-none focus:border-red-700"
                />

                <button
                  type="submit"
                  disabled={posting}
                  className="rounded-xl bg-red-700 p-3 font-black hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting ? "Posting..." : "Post Live Update"}
                </button>
              </div>
            </form>
          )}

          {!canPost && (
            <div className="rounded-3xl border border-zinc-800 bg-black/60 p-6">
              <h2 className="text-2xl font-black">View Only</h2>
              <p className="mt-3 leading-7 text-zinc-400">
                You can view live command updates. Posting is limited to command
                staff and admins.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">Live Command Feed</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Updates appear automatically while this page is open.
              </p>
            </div>

            <div className="rounded-full border border-green-900 bg-green-950/40 px-3 py-1 text-xs font-bold text-green-400">
              Live
            </div>
          </div>

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-black/50 p-5 text-zinc-400">
              No command posts yet.
            </p>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-zinc-800 bg-black/60 p-6 transition hover:border-red-900"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
                        Command Update
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        {post.title}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-600">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap leading-7 text-zinc-300">
                    {post.content}
                  </p>

                  <p className="mt-5 border-t border-zinc-900 pt-4 text-sm text-zinc-500">
                    Posted by{" "}
                    <span className="font-bold text-red-400">
                      {post.author || "Umbra Command"}
                    </span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-sm text-zinc-500">
        © 2955 Umbra Corporation / UCOR — Victoria ex Umbra
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
              Corporation
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
    <div className="rounded-2xl border border-zinc-800 bg-black/50 p-5">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black text-red-400">{value}</p>
    </div>
  );
}