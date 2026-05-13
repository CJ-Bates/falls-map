"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Small "Tell us something?" chip that opens a modal where guests can drop
// feedback, suggestions, or "the firewood was low" notes. Lands in Supabase
// `feedback` table and shows up on the admin dashboard.

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setStatus({ state: "sending" });
    const { error } = await supabase.from("feedback").insert({
      message: trimmed,
      email: email.trim() || null,
      page: typeof window !== "undefined" ? window.location.pathname : null,
    });
    if (error) {
      setStatus({ state: "error", msg: error.message });
      return;
    }
    setStatus({ state: "sent" });
    setMessage("");
    setEmail("");
    setTimeout(() => {
      setOpen(false);
      setStatus({ state: "idle" });
    }, 1600);
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
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="ios-glass-strong relative w-full max-w-sm rounded-3xl p-6 text-[#F0E2C2] shadow-[0_18px_44px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="ios-press absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-[#F0E2C2]/10 text-[#F0E2C2]/70"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>

            <h2 className="ios-title text-xl">Tell CJ something</h2>
            <p className="text-[12px] text-[#F0E2C2]/65 mt-1 leading-snug">
              Bug, idea, "the firepit needed wood" — whatever. Goes straight to CJ&apos;s dashboard.
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
              placeholder="Email (optional — only if you want a reply)"
              maxLength={120}
              className="mt-2 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[13px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12"
            />

            {status.state === "error" && (
              <div className="mt-3 rounded-2xl bg-red-900/30 border border-red-400/30 px-3 py-2 text-[12px] text-red-200">
                {status.msg}
              </div>
            )}
            {status.state === "sent" && (
              <div className="mt-3 rounded-2xl bg-[#7d8f5a]/20 border border-[#7d8f5a]/40 px-3 py-2 text-[12px] text-[#cae2a3]">
                Sent. Thanks for the note.
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
        </div>
      )}
    </>
  );
}
