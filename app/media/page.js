"use client";

import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import OnlineMembers from "@/components/OnlineMembers";
import { supabase } from "@/lib/supabase";
import { getUserStatus } from "@/lib/getUserStatus";

export default function MediaPage() {
  const [videos, setVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [isApprovedMember, setIsApprovedMember] = useState(false);

  useEffect(() => {
    checkAccess();

    const videosChannel = supabase
      .channel("media-files-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media_files" },
        () => fetchVideos()
      )
      .subscribe();

    const commentsChannel = supabase
      .channel("media-comments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media_comments" },
        () => fetchComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  async function checkAccess() {
    const status = await getUserStatus();

    if (!status.user || status.status !== "approved") {
      window.location.href = "/";
      return;
    }

    setCurrentUser(status.user);
    setIsApprovedMember(true);
    setLoadingAccess(false);

    await fetchVideos();
    await fetchComments();
  }

  async function fetchVideos() {
    const { data, error } = await supabase
      .from("media_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setVideos(data || []);
  }

  async function fetchComments() {
    const { data, error } = await supabase
      .from("media_comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setComments(data || []);
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a video.");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to upload.");
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];

      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Only MP4, WEBM, or MOV videos are allowed.");
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      const progressTimer = setInterval(() => {
        setUploadProgress((current) => {
          if (current >= 90) return current;
          return current + 5;
        });
      }, 700);

      const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

      const filePath = `${user.id}/${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from("media-videos")
        .upload(filePath, selectedFile);

      clearInterval(progressTimer);

      if (uploadError) {
        console.error(uploadError);
        alert("Upload failed.");
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(95);

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Unknown User";

      const { error: dbError } = await supabase.from("media_files").insert({
        title: title.trim(),
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        uploaded_by: user.id,
        uploaded_by_name: displayName,
      });

      if (dbError) {
        console.error(dbError);
        alert("Database save failed.");
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(100);

      setTitle("");
      setSelectedFile(null);

      await fetchVideos();

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 800);
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function downloadVideo(video) {
    const { data, error } = await supabase.storage
      .from("media-videos")
      .createSignedUrl(video.file_path, 60);

    if (error) {
      console.error(error);
      alert("Could not create download link.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  async function deleteVideo(video) {
    const confirmDelete = window.confirm(
      `Delete "${video.title}"? This cannot be undone.`
    );

    if (!confirmDelete) return;

    const { error: storageError } = await supabase.storage
      .from("media-videos")
      .remove([video.file_path]);

    if (storageError) {
      console.error(storageError);
      alert("Could not delete video file.");
      return;
    }

    const { error: dbError } = await supabase
      .from("media_files")
      .delete()
      .eq("id", video.id);

    if (dbError) {
      console.error(dbError);
      alert("Video file deleted, but database delete failed.");
      return;
    }

    await fetchVideos();
    await fetchComments();
  }

  function formatSize(bytes) {
    if (!bytes) return "Unknown size";

    const mb = bytes / 1024 / 1024;

    return `${mb.toFixed(2)} MB`;
  }

  if (loadingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <p className="text-2xl font-black">
            Verifying Umbra Clearance...
          </p>

          <p className="mt-2 text-zinc-500">
            Checking member authorization.
          </p>
        </div>
      </main>
    );
  }

  if (!isApprovedMember) {
    return null;
  }

  return (
    <main className="page-fade relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <OnlineMembers />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,38,38,0.4),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(220,38,38,0.3),transparent_40%)] opacity-30" />

      <section className="relative min-h-screen bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <header className="rounded-3xl border border-zinc-900 bg-black/70 p-4 shadow-2xl shadow-red-950/30 backdrop-blur-xl transition hover:border-red-900">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <a href="/" className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-800 bg-black shadow-lg shadow-red-950/40">
                  <img
                    src="/logo.png"
                    className="h-10 w-10"
                    alt="Umbra Logo"
                  />
                </div>

                <div>
                  <p className="text-2xl font-black tracking-[0.25em]">
                    UMBRA
                  </p>

                  <p className="text-xs uppercase tracking-[0.35em] text-red-500">
                    Media Library
                  </p>
                </div>
              </a>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/"
                  className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-red-900 hover:bg-zinc-900"
                >
                  Home
                </a>

                <a
                  href="/about"
                  className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-red-900 hover:bg-zinc-900"
                >
                  About
                </a>

                <UserMenu />
              </div>
            </div>
          </header>

          <div className="py-14">
            <div className="mb-10">
              <p className="mb-5 inline-block rounded-full border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-300">
                Members Only Archive
              </p>

              <h1 className="text-5xl font-black leading-tight md:text-6xl">
                Umbra Media Library
              </h1>

              <p className="mt-5 max-w-3xl text-lg text-zinc-400">
                Upload, preview, store, download, delete your own uploads, and
                discuss official Umbra Corporation media files.
              </p>
            </div>

            <div className="mb-10 rounded-3xl border border-red-950 bg-black/60 p-6 shadow-2xl shadow-red-950/20 backdrop-blur-xl">
              <h2 className="text-2xl font-black">Upload New Video</h2>

              <p className="mt-2 text-sm text-zinc-500">
                Supported formats: MP4, WEBM, and MOV.
              </p>

              <form onSubmit={handleUpload} className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Video title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-800"
                  />

                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-red-800 file:px-4 file:py-2 file:font-black file:text-white hover:file:bg-red-700"
                  />
                </div>

                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full rounded-2xl bg-red-700 px-8 py-4 font-black shadow-lg shadow-red-950/40 transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading
                      ? `Uploading... ${uploadProgress}%`
                      : "Upload Video"}
                  </button>

                  {uploading && (
                    <div className="mt-4">
                      <div className="h-4 overflow-hidden rounded-full bg-zinc-900">
                        <div
                          className="h-full rounded-full bg-red-700 transition-all duration-300"
                          style={{
                            width: `${uploadProgress}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-center text-sm text-zinc-500">
                        Uploading video to Umbra archives...
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Uploaded Videos</h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {videos.length} file
                  {videos.length === 1 ? "" : "s"} stored in the archive.
                </p>
              </div>
            </div>

            {videos.length === 0 ? (
              <div className="rounded-3xl border border-zinc-800 bg-black/60 p-10 text-center text-zinc-500 shadow-xl">
                No videos uploaded yet.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    allComments={comments}
                    currentUser={currentUser}
                    onDownload={() => downloadVideo(video)}
                    onDelete={() => deleteVideo(video)}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function VideoCard({
  video,
  allComments,
  currentUser,
  onDownload,
  onDelete,
  formatSize,
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  const isOwner = currentUser?.id === video.uploaded_by;

  const videoComments = allComments.filter(
    (comment) => comment.media_id === video.id
  );

  useEffect(() => {
    async function loadVideo() {
      const { data } = await supabase.storage
        .from("media-videos")
        .createSignedUrl(video.file_path, 3600);

      if (data?.signedUrl) {
        setVideoUrl(data.signedUrl);
      }
    }

    loadVideo();
  }, [video.file_path]);

  async function postComment(e) {
    e.preventDefault();

    if (!commentText.trim()) return;

    setPosting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to comment.");
      setPosting(false);
      return;
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "Unknown User";

    const { error } = await supabase.from("media_comments").insert({
      media_id: video.id,
      user_id: user.id,
      comment: commentText.trim(),
      user_name: displayName,
    });

    if (error) {
      console.error(error);
      alert("Could not post comment.");
      setPosting(false);
      return;
    }

    setCommentText("");
    setPosting(false);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black/60 shadow-2xl shadow-red-950/10 transition hover:scale-[1.01] hover:border-red-900">
      <div className="aspect-video border-b border-zinc-900 bg-zinc-950">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            Loading Preview...
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-black">{video.title}</h3>

        <p className="mt-1 text-sm text-red-400">
          Posted by {video.uploaded_by_name || "Unknown User"}
        </p>

        <p className="mt-2 break-all text-sm text-zinc-500">
          {video.file_name}
        </p>

        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>{formatSize(video.file_size)}</span>

          <span>
            {new Date(video.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            onClick={onDownload}
            className="w-full rounded-2xl border border-green-800 bg-green-950/30 px-5 py-3 font-black text-green-300 transition hover:bg-green-900/40 active:scale-95"
          >
            Download Video
          </button>

          {isOwner && (
            <button
              onClick={onDelete}
              className="w-full rounded-2xl border border-red-800 bg-red-950/40 px-5 py-3 font-black text-red-300 transition hover:bg-red-900/50 active:scale-95"
            >
              Delete Video
            </button>
          )}
        </div>

        <div className="mt-6 border-t border-zinc-900 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-black text-zinc-200">Comments</h4>

            <span className="text-xs text-zinc-600">
              {videoComments.length}
            </span>
          </div>

          <form onSubmit={postComment} className="mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-800"
            />

            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              className="mt-3 w-full rounded-2xl bg-red-700 px-5 py-3 text-sm font-black transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {posting ? "Posting..." : "Post Comment"}
            </button>
          </form>

          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {videoComments.length === 0 ? (
              <p className="rounded-2xl border border-zinc-900 bg-zinc-950/70 p-4 text-sm text-zinc-600">
                No comments yet.
              </p>
            ) : (
              videoComments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-900 bg-zinc-950/70 p-4"
                >
                  <p className="text-xs font-bold text-red-400">
                    {item.user_name || "Unknown User"}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                    {item.comment}
                  </p>

                  <p className="mt-2 text-xs text-zinc-600">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}