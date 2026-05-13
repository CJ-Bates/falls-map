"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Small "Send feedback" chip that opens a modal. Guests drop a note +
// optional email. Lands in Supabase `feedback` (shows on /admin) and
// fires a fire-and-forget push to /api/notify-feedback so CJ gets a
// phone notification via ntfy.sh.

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; msg: string };

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const close = () => {
    setOpen(false);
    setStatus({ state: "idle" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setStatus({ state: "sending" });
    const page = typeof window !== "undefined" ? window.location.pathname : null;
    const trimmedEmail = email.trim() || null;
    const { error } = await supabase.from("feedback").insert({
      message: trimmed,
      email: trimmedEmail,
      page,
    });
    if (error) {
      setStatus({ state: "error", msg: error.message });
      return;
    }
    // Fire-and-forget push to CJ. Don't block the UI if it fails.
    try {
      void fetch("/api/notify-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, email: trimmedEmail, page }),
      });
    } catch {
      // ignore
    }
    setStatus({ state: "sent" });
    setMessage("");
    setEmail("");
    setTimeout(close, 2600);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2]/8 border border-[#F0E2C2]/18 px-3.5 py-2 text-[12px] font-semibold text-[#F0E2C2]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Send feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-md p-4"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ios-glass-strong relative w-full max-w-sm rounded-3xl p-6 text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
          >
            {status.state === "sent" ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div
                  className="grid h-16 w-16 place-items-center rounded-full bg-[#7d8f5a]/25 ring-2 ring-[#a8c47a]/60 animate-[pop_280ms_ease-out]"
                  style={{
                    boxShadow: "0 0 0 6px rgba(168,196,122,0.10), 0 6px 20px rgba(125,143,90,0.35)",
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#cae2a3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <h2 className="ios-title text-2xl mt-4">Sent &mdash; thanks!</h2>
                <p className="text-[13px] text-[#F0E2C2]/70 mt-1 leading-snug max-w-[260px]">
                  Your note just pinged CJ&apos;s phone. He&apos;ll see it shortly.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="ios-press mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#F0E2C2]/10 border border-[#F0E2C2]/20 px-4 py-2 text-[12px] font-semibold"
                >
                  Done
                </button>
                <style jsx>{`
                  @keyframes pop {
                    0% { transform: scale(0.6); opacity: 0; }
                    70% { transform: scale(1.08); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                `}</style>
              </div>
            ) : (
              <form onSubmit={submit}>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="ios-press absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>

                <h2 className="ios-title text-xl">Tell CJ something</h2>
                <p className="text-[12px] text-[#F0E2C2]/65 mt-1 leading-snug">
                  Bug, idea, &ldquo;the firepit needed wood&rdquo; &mdash; whatever. Goes straight to CJ&apos;s dashboard.
                </p>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What&rsquo;s on your mind?"
                  rows={4}
                  maxLength={1000}
                  required
                  className="mt-4 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12 resize-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional &mdash; only if you want a reply)"
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[13px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12"
                />

                {status.state === "error" && (
                  <div className="mt-3 rounded-2xl bg-red-900/30 border border-red-400/30 px-3 py-2 text-[12px] text-red-200">
                    {status.msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!message.trim() || status.state === "sending"}
                  className="ios-press mt-4 w-full rounded-2xl bg-[#F0E2C2] text-[#1A1310] font-semibold py-3 shadow-[0_8px_24px_rgba(184,153,104,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.state === "sending" ? "Sending…" : "Send"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
