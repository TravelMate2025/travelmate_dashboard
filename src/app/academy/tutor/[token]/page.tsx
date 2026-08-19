"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import env from "@/config/env";
import {
  getTutorPortal,
  getTutorSessions,
  getTutorSends,
  createTutorSend,
  TutorPortal,
  TutorClassSession,
  QuestionsLinkSend,
} from "@/services/academyTutor/api";
import { TutorSubmissionsModal } from "./TutorSubmissionsModal";

const WEB_FRONTEND_URL = env.links.USER_FRONTEND_URL;
const questionsLinkUrl = (shareToken: string) => `${WEB_FRONTEND_URL}/academy/questions/${shareToken}`;

// Same sentinel-value approach as the admin dashboard's scope <select>
// -- see that file's comment for why a third value is needed.
const ATTENDED_ANY_VALUE = "__attended_any__";

const scopeLabel = (send: Pick<QuestionsLinkSend, "scope" | "session_label">) => {
  if (send.scope === "session") return `Attendees: ${send.session_label}`;
  if (send.scope === "attended_any") return "Attended any session";
  return "All registrants";
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const windowBadgeClass: Record<TutorClassSession["window_status"], string> = {
  open: "border-[#2D9C5E] text-[#2D9C5E] bg-[#2D9C5E1A]",
  closed: "border-[#9B9EA4] text-[#67696D] bg-[#F5F5F5]",
  not_started: "border-[#EFB608] text-[#9A7000] bg-[#EFB6081A]",
};

const windowBadgeLabel: Record<TutorClassSession["window_status"], string> = {
  open: "Open now",
  closed: "Closed",
  not_started: "Not started",
};

// This route lives outside /Dashboard entirely -- no AuthContext, no
// sidebar, no link back into the authenticated admin app. The
// magic_token in the URL is the only credential; there is nothing
// else this page can reach.
export default function TutorPortalPage() {
  const { token }: { token: string } = useParams();

  const [portal, setPortal] = useState<TutorPortal | null>(null);
  const [sessions, setSessions] = useState<TutorClassSession[]>([]);
  const [sends, setSends] = useState<QuestionsLinkSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);

  const [showNewSend, setShowNewSend] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendUrl, setSendUrl] = useState("");
  const [sendSessionId, setSendSessionId] = useState("");
  const [sendDeadline, setSendDeadline] = useState("");
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [copiedSendToken, setCopiedSendToken] = useState<string | null>(null);
  const [viewingSend, setViewingSend] = useState<QuestionsLinkSend | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [portalData, sessionsData, sendsData] = await Promise.all([
        getTutorPortal(token),
        getTutorSessions(token),
        getTutorSends(token),
      ]);
      setPortal(portalData);
      setSessions(sessionsData);
      setSends(sendsData);
    } catch {
      // A missing or revoked magic_token 404s every one of these --
      // there is no scenario where only one call fails and the token
      // is still valid, so any failure here means the same thing.
      setInvalidToken(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateSend = async () => {
    if (!sendUrl) return;
    setSendSubmitting(true);
    setSendError(null);
    try {
      await createTutorSend(token, {
        title: sendTitle,
        questions_url: sendUrl,
        session_id: sendSessionId && sendSessionId !== ATTENDED_ANY_VALUE ? sendSessionId : null,
        require_attendance: sendSessionId === ATTENDED_ANY_VALUE,
        deadline_at: sendDeadline ? new Date(sendDeadline).toISOString() : null,
      });
      setShowNewSend(false);
      setSendTitle("");
      setSendUrl("");
      setSendSessionId("");
      setSendDeadline("");
      const sendsData = await getTutorSends(token);
      setSends(sendsData);
    } catch {
      setSendError("Could not send this questions link. Check the URL and try again.");
    } finally {
      setSendSubmitting(false);
    }
  };

  const copySendLink = async (shareToken: string) => {
    try {
      await navigator.clipboard.writeText(questionsLinkUrl(shareToken));
      setCopiedSendToken(shareToken);
      setTimeout(
        () => setCopiedSendToken((current) => (current === shareToken ? null : current)),
        2000,
      );
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — link is still visible to copy manually.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (invalidToken || !portal) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] rounded-2xl border border-[#dfe7f0] bg-white p-8 text-center shadow-sm">
          <h1 className="text-[18px] font-semibold text-[#181818]">This link isn't valid</h1>
          <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
            This tutor link has been revoked or doesn't exist. If you're still meant to have
            access, ask the class organizer to resend your link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-[880px] px-4 py-10 space-y-[28px]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">
            Tutor portal
          </p>
          <h1 className="text-[24px] font-semibold text-[#181818]">
            {portal.training_class_name}
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">Signed in as {portal.tutor_full_name}</p>
        </div>

        {/* Sessions (read-only) */}
        <section className="space-y-4">
          <h2 className="text-[16px] font-semibold text-[#181818]">Sessions ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
              No sessions yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#023E8A]">
                      {session.label}
                    </p>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${windowBadgeClass[session.window_status]}`}
                    >
                      {windowBadgeLabel[session.window_status]}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500">
                    {new Date(session.session_start_at).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[22px] font-bold text-[#181818] leading-none">
                    {session.present_count}
                    <span className="ml-1.5 text-[11px] font-normal text-gray-500">
                      checked in
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Questions links */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#181818]">
              Questions links ({sends.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowNewSend((v) => !v)}
              className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D]"
            >
              {showNewSend ? "Cancel" : "Send questions link"}
            </button>
          </div>

          {showNewSend && (
            <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                    Questions link URL
                  </label>
                  <input
                    type="url"
                    value={sendUrl}
                    onChange={(e) => setSendUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                    Send to
                  </label>
                  <select
                    value={sendSessionId}
                    onChange={(e) => setSendSessionId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All registrants</option>
                    <option value={ATTENDED_ANY_VALUE}>Attended any session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Attendees of {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                    placeholder="Week 1 quiz"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                    Submission deadline (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={sendDeadline}
                    onChange={(e) => setSendDeadline(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    Registrants can still view the link after this passes, but can no longer
                    submit or resubmit.
                  </p>
                </div>
              </div>
              {sendSessionId === ATTENDED_ANY_VALUE && (
                <p className="text-[12px] text-gray-500">
                  Only registrants who checked in to <strong className="text-[#181818]">any</strong>{" "}
                  session will be able to view or submit through this link.
                </p>
              )}
              {sendSessionId && sendSessionId !== ATTENDED_ANY_VALUE && (
                <p className="text-[12px] text-gray-500">
                  Only registrants who checked in to{" "}
                  <strong className="text-[#181818]">
                    {sessions.find((s) => s.id === sendSessionId)?.label}
                  </strong>{" "}
                  will be able to view or submit through this link.
                </p>
              )}
              {sendError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {sendError}
                </p>
              )}
              <button
                type="button"
                onClick={handleCreateSend}
                disabled={sendSubmitting || !sendUrl}
                className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendSubmitting ? "Sending…" : "Send questions link"}
              </button>
            </div>
          )}

          {sends.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
              No questions links sent yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sends.map((send) => (
                <div
                  key={send.id}
                  className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm space-y-3"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#023E8A]">
                      {send.title || "Questions link"}
                    </p>
                    <p className="text-[12px] text-gray-500">{scopeLabel(send)}</p>
                    {send.deadline_at && (
                      <p
                        className={`mt-1 text-[11px] font-medium ${send.is_past_deadline ? "text-[#D72638]" : "text-gray-500"}`}
                      >
                        {send.is_past_deadline ? "Deadline passed: " : "Due "}
                        {formatDateTime(send.deadline_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-[22px] font-bold text-[#181818] leading-none">
                      {send.submission_count}
                    </p>
                    <p className="text-[11px] text-gray-500">submitted</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copySendLink(send.share_token)}
                      className="flex-1 rounded-lg border border-[#dfe7f0] px-2.5 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                    >
                      {copiedSendToken === send.share_token ? "Link copied ✓" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingSend(send)}
                      className="flex-1 rounded-lg border border-[#dfe7f0] px-2.5 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                    >
                      View submissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {viewingSend && (
          <TutorSubmissionsModal
            token={token}
            send={viewingSend}
            onClose={() => setViewingSend(null)}
          />
        )}
      </div>
    </div>
  );
}
