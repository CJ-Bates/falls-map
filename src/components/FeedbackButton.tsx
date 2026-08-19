"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/supabase";

// Stay-feedback widget — for ideas, compliments, app bugs, and suggestions
// about how to make future stays better. NOT for urgent service requests
// (those go to the host directly via the number in the welcome email).
//
// Submits through /api/feedback, which validates, rate-limits, stores the
// row (server-side key — anon has no access to the table), and pushes a
// phone notification to the host.

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "sent" }
  | { state: "error"; msg: string };

const PLACEHOLDERS: Record<FeedbackCategory, string> = {
  property: "What stood out? What could we improve? Anything missing?",
  app: "Found a bug? Something confusing? Ideas?",
  suggestion: "What should we add for future guests?",
  compliment: "Tell us what you loved — we'll pass it on to the team.",
  other: "What's on your mind?",
};

function CategoryIcon({ value }: { value: FeedbackCategory }) {
  const common = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (value) {
    case "property":
      return (<svg {...common}><path d="M3 12 12 4l9 8"/><path d="M5 12v9h14v-9"/></svg>);
    case "app":
      return (<svg {...common}><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>);
    case "suggestion":
      return (<svg {...common}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2v1.3h6V16.7c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z"/></svg>);
    case "compliment":
      return (<svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);
    case "other":
    default:
      return (<svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  }
}

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("property");
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
    let res: Response;
    try {
      res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, email: trimmedEmail, page, category }),
      });
    } catch {
      setStatus({ state: "error", msg: "No connection — please try again when you have signal." });
      return;
    }
    if (!res.ok) {
      setStatus({
        state: "error",
        msg:
          res.status === 429
            ? "That's plenty of feedback for now — thank you! Please try again in a bit."
            : "Something went wrong sending that. Please try again.",
      });
      return;
    }
    setStatus({ state: "sent" });
    setMessage("");
    setEmail("");
    setCategory("property");
    setTimeout(close, 2600);
  };

  return (
    <>
      <button
        onClick={() => { track("feedback_open"); setOpen(true); }}
        className="ios-press inline-flex items-center gap-2 rounded-full bg-[#F0E2C2]/8 border border-[#F0E2C2]/18 px-3.5 py-2 text-[12px] font-semibold text-[#F0E2C2]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Leave feedback
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
                <h2 className="ios-title text-2xl mt-4">Thanks!</h2>
                <p className="text-[13px] text-[#F0E2C2]/70 mt-1 leading-snug max-w-[260px]">
                  Your feedback is in. We'll read every word and use it to make future stays better.
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

                <h2 className="ios-title text-xl">How was your stay?</h2>
                <p className="text-[12px] text-[#F0E2C2]/65 mt-1 leading-snug">
                  Suggestions, compliments, app bugs, things to add &mdash; we want all of it. It helps us make future stays better.
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
                  className="mt-3 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[14px] text-[#F0E2C2] placeholder-[#F0E2C2]/50 outline-none focus:bg-[#F0E2C2]/12 resize-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional &mdash; only if you want a reply)"
                  maxLength={120}
                  className="mt-2 w-full rounded-2xl bg-[#F0E2C2]/8 px-3.5 py-2.5 text-[13px] text-[#F0E2C2] placeholder-[#F0E2C2]/50 outline-none focus:bg-[#F0E2C2]/12"
                />

                <p className="mt-3 text-[11px] text-[#F0E2C2]/55 leading-snug">
                  Need something during your stay (firewood, towels, something broken)? Please text or call the host directly &mdash; the number is in your welcome email. This widget isn&apos;t monitored in real time.
                </p>

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
                  {status.state === "sending" ? "Sending\u2026" : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
