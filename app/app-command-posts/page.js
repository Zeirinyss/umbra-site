"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AppCommandPosts() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    loadPosts();
    loadComments();

    const channel = supabase
      .channel("app-command-posts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "command_posts" },
        () => {
          loadPosts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "command_post_comments" },
        () => {
          loadComments();
        }
      )
      .subscribe((status) => {
        console.log("Command posts realtime status:", status);
      });

    const refreshTimer = setInterval(() => {
      loadPosts();
      loadComments();
    }, 3000);

    return () => {
      clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("command_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load posts:", error);
      return;
    }

    setPosts(data || []);
  }

  async function loadComments() {
    const { data, error } = await supabase
      .from("command_post_comments")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load comments:", error);
      return;
    }

    const grouped = {};

    (data || []).forEach((comment) => {
      if (!grouped[comment.post_id]) {
        grouped[comment.post_id] = [];
      }

      grouped[comment.post_id].push(comment);
    });

    setComments(grouped);
  }

  async function postComment(postId) {
    const text = inputs[postId];

    if (!text?.trim()) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      alert("Not logged in");
      return;
    }

    const { data: member } = await supabase
      .from("members")
      .select("rsi_handle")
      .eq("email", user.email)
      .maybeSingle();

    const displayName = member?.rsi_handle || user.email;

    const { error } = await supabase
      .from("command_post_comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        author: displayName,
        comment: text.trim(),
      });

    if (error) {
      console.error("Failed to send comment:", error);
      alert("Comment failed to send.");
      return;
    }

    setInputs((current) => ({
      ...current,
      [postId]: "",
    }));

    loadComments();
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 text-white">
      <h1 className="mb-4 text-2xl font-black">Command Posts</h1>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-xl border border-zinc-800 bg-black p-4"
          >
            <p className="text-xs uppercase tracking-widest text-red-500">
              Command Update
            </p>

            <h2 className="mt-2 text-xl font-black">
              {post.title}
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
              {post.content}
            </p>

            <p className="mt-3 text-xs text-zinc-500">
              Posted by {post.author || "Umbra Command"}
            </p>

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="mb-2 text-sm font-black text-zinc-400">
                Comments
              </p>

              <div className="space-y-2">
                {(comments[post.id] || []).map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg bg-zinc-900 p-3"
                  >
                    <p className="text-xs font-bold text-red-400">
                      {comment.author || "Member"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-300">
                      {comment.comment}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={inputs[post.id] || ""}
                  onChange={(e) =>
                    setInputs((current) => ({
                      ...current,
                      [post.id]: e.target.value,
                    }))
                  }
                  placeholder="Write comment..."
                  className="flex-1 rounded-lg bg-zinc-900 p-2 text-sm outline-none"
                />

                <button
                  onClick={() => postComment(post.id)}
                  className="rounded-lg bg-red-700 px-3 text-sm font-black"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}