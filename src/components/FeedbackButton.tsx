"use client";

import { useState } from "react";
import { supabase, FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/supabase";

// Small "Send feedback" chip that opens a modal. Guests pick a category
// (firewood, towels, broken, trash, other request, or just a note), drop
// the details + optional email. Lands in Supabase `feedback` (shows on
// /admin) and fires a fire-and-forget push to /api/notify-feedback so CJ
// gets a phone notification via ntfy.sh.

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; msg: string };

const PLACEHOLDERS: Record<FeedbackCategory, string> = {
  firewood: "How much? Any preference on where to drop it?",
  towels: "Bath towels, hand towels, sheets? How many?",
  repair: "What broke? Which cabin / room?",
  trash: "Cans full? Anything we should know?",
  other: "What do you need?",
  note: "What's on your mind?",
};

// Tiny inline icons for each category — keeps the look consistent without emojis
function CategoryIcon({ value }: { value: FeedbackCategory }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (value) {
    case "firewood":
      return (<svg {...common}><path d="M12 3c-1.5 3-4 4-4 8 a4 4 0 0 0 8 0c0-4-2.5-5-4-8z"/></svg>);
    case "towels":
      return (<svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>);
    case "repair":
      return (<svg {...common}><path d="M14.7 6.3a4 4 0 1 1-5 5l-7 7v3h3l7-7a4 4 0 0 0 5-5l-2 2-2-2 2-2z"/></svg>);
    case "trash":
      return (<svg {...common}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><rect x="5" y="6" width="14" height="16" rx="2"/></svg>);
    case "other":
      return (<svg {...common}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1 1-1 1.7"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>);
    case "note":
    default:
      return (<svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  }
}

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("note");
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
      category,
    });
    if (error) {
      setStatus({ state: "error", msg: error.message });
      return;
    }
    // Fire-and-forget push so CJ's phone rings. Includes category for the title.
    try {
      void fetch("/api/notify-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, email: trimmedEmail, page, category }),
      });
    } catch {
      // ignore
    }
    setStatus({ state: "sent" });
    setMessage("");
    setEmail("");
    setCategory("note");
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
        Need something / send feedback
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
                  style={{ boxShadow: "0 0 0 6px rgba(168,196,122,0.10), 0 6px 20px rgba(125,143,90,0.35)" }}
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

                <h2 className="ios-title text-xl">Need something?</h2>
                <p className="text-[12px] text-[#F0E2C2]/65 mt-1 leading-snug">
                  Pick what it is, drop the details, hit send. Goes straight to CJ.
                </p>

                {/* Category chips */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {FEEDBACK_CATEGORIES.map((c) => {
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={
                          "ios-press inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors " +
                          (active
                            ? "bg-[#F0E2C2] text-[#1A1310] border-[#F0E2C2]"
                            : "bg-[#F0E2C2]/8 text-[#F0E2C2] border-[#F0E2C2]/20")
                        }
                      >
                        <CategoryIcon value={c.value} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={PLACEHOLDERS[category]}
                  rows={4}
                  maxLength={1000}
                  required
                  className="mt-3 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] placeholder-[#F0E2C2]/35 outline-none focus:bg-[#F0E2C2]/12 resize-none"
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
