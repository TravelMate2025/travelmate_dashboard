"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import env from "@/config/env";
import academyService from "@/services/academy";
import type {
  ClassSession,
  ClassTutor,
  QuestionsLinkSend,
  Registrant,
  TrainingClass,
} from "@/services/academy/types";
import { AssignmentSubmissionsModal } from "../AssignmentSubmissionsModal";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";

const WEB_FRONTEND_URL = env.links.USER_FRONTEND_URL;

const checkInUrl = (qrToken: string) => `${WEB_FRONTEND_URL}/academy/checkin/${qrToken}`;
const registerUrl = (classSlug: string) => `${WEB_FRONTEND_URL}/academy/${classSlug}/register`;
const questionsLinkUrl = (shareToken: string) => `${WEB_FRONTEND_URL}/academy/questions/${shareToken}`;
const tutorPortalUrl = (magicToken: string) => `${window.location.origin}/academy/tutor/${magicToken}`;

// The scope <select> needs a third value distinct from "" (all
// registrants) and a real session id -- this sentinel means "attended
// any session," translated into {session_id: null, require_attendance:
// true} in handleCreateSend rather than sent to the backend as-is.
const ATTENDED_ANY_VALUE = "__attended_any__";

const scopeLabel = (send: Pick<QuestionsLinkSend, "scope" | "session_label">) => {
  if (send.scope === "session") return `Attendees: ${send.session_label}`;
  if (send.scope === "attended_any") return "Attended any session";
  return "All registrants";
};

const formatDeadline = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

const windowBadgeClass: Record<ClassSession["window_status"], string> = {
  open: "border-[#2D9C5E] text-[#2D9C5E] bg-[#2D9C5E1A]",
  closed: "border-[#9B9EA4] text-[#67696D] bg-[#F5F5F5]",
  not_started: "border-[#EFB608] text-[#9A7000] bg-[#EFB6081A]",
};

const windowBadgeLabel: Record<ClassSession["window_status"], string> = {
  open: "Open now",
  closed: "Closed",
  not_started: "Not started",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function SessionQr({ qrToken }: { qrToken: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = checkInUrl(qrToken);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 120, margin: 1 }).then((result) => {
      if (!cancelled) setDataUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) {
    return <div className="h-[120px] w-[120px] animate-pulse rounded-lg bg-gray-100" />;
  }

  return (
    <img src={dataUrl} alt="Check-in QR code" className="h-[120px] w-[120px] rounded-lg border border-[#dfe7f0]" />
  );
}

export default function AcademyClassDetailPage() {
  const { slug }: { slug: string } = useParams();
  const router = useRouter();

  const [trainingClass, setTrainingClass] = useState<TrainingClass | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [registerLinkCopied, setRegisterLinkCopied] = useState(false);
  const [togglingRegistration, setTogglingRegistration] = useState(false);

  const [showNewSession, setShowNewSession] = useState(false);
  const [label, setLabel] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("10:00");
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingClass, setDeletingClass] = useState(false);
  const [classDeleteSubmitting, setClassDeleteSubmitting] = useState(false);
  const [deletingSession, setDeletingSession] = useState<ClassSession | null>(null);
  const [sessionDeleteSubmitting, setSessionDeleteSubmitting] = useState(false);
  const [deletingRegistrant, setDeletingRegistrant] = useState<Registrant | null>(null);
  const [registrantDeleteSubmitting, setRegistrantDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Tutor
  const [tutor, setTutor] = useState<ClassTutor | null>(null);
  const [showAssignTutor, setShowAssignTutor] = useState(false);
  const [tutorNameInput, setTutorNameInput] = useState("");
  const [tutorEmailInput, setTutorEmailInput] = useState("");
  const [tutorSubmitting, setTutorSubmitting] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [tutorLinkCopied, setTutorLinkCopied] = useState(false);
  const [resendingTutor, setResendingTutor] = useState(false);
  const [revokingTutor, setRevokingTutor] = useState(false);
  const [tutorRevokeSubmitting, setTutorRevokeSubmitting] = useState(false);

  // Questions links
  const [questionsLinkSends, setQuestionsLinkSends] = useState<QuestionsLinkSend[]>([]);
  const [showNewSend, setShowNewSend] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendUrl, setSendUrl] = useState("");
  const [sendSessionId, setSendSessionId] = useState("");
  const [sendDeadline, setSendDeadline] = useState("");
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [copiedSendToken, setCopiedSendToken] = useState<string | null>(null);
  const [viewingSend, setViewingSend] = useState<QuestionsLinkSend | null>(null);
  const [deletingSend, setDeletingSend] = useState<QuestionsLinkSend | null>(null);
  const [sendDeleteSubmitting, setSendDeleteSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sessionsRes, registrantsRes, sendsRes] = await Promise.all([
        academyService.getClass(slug),
        academyService.getSessions(slug),
        academyService.getRegistrants(slug),
        academyService.getQuestionsLinkSends(slug),
      ]);
      setTrainingClass(classRes.data);
      setSessions(sessionsRes.data.results);
      setRegistrants(registrantsRes.data.results);
      setQuestionsLinkSends(sendsRes.data.results);
      try {
        const tutorRes = await academyService.getTutor(slug);
        setTutor(tutorRes.data);
      } catch {
        // No tutor assigned yet -- the endpoint 404s, which is expected
        // and not an error state for this page.
        setTutor(null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleCreateSession = async () => {
    if (!sessionDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const startAt = new Date(`${sessionDate}T${sessionTime}:00`);
      await academyService.createSession(slug, {
        label,
        session_date: sessionDate,
        session_start_at: startAt.toISOString(),
        checkin_window_minutes: windowMinutes,
      });
      setShowNewSession(false);
      setLabel("");
      setSessionDate("");
      setSessionTime("10:00");
      setWindowMinutes(15);
      await loadAll();
    } catch {
      setError("Could not create this session. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQr = async (session: ClassSession) => {
    const dataUrl = await QRCode.toDataURL(checkInUrl(session.qr_token), {
      width: 512,
      margin: 2,
    });
    const safeLabel = session.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `checkin-qr-${safeLabel || session.id}.png`;
    link.click();
  };

  const toggleRegistration = async () => {
    if (!trainingClass) return;
    setTogglingRegistration(true);
    try {
      const response = await academyService.setRegistrationOpen(
        slug,
        !trainingClass.registration_open,
      );
      setTrainingClass(response.data);
    } finally {
      setTogglingRegistration(false);
    }
  };

  const getDeleteErrorMessage = (err: unknown): string => {
    const detail = (err as { response?: { data?: { error?: string; detail?: string } } })
      ?.response?.data;
    return detail?.error || detail?.detail || "Something went wrong. Please try again.";
  };

  const handleDeleteClass = async () => {
    setClassDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await academyService.deleteClass(slug);
      router.push("/Dashboard/academy");
    } catch (err: unknown) {
      setDeleteError(getDeleteErrorMessage(err));
    } finally {
      setClassDeleteSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    setSessionDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await academyService.deleteSession(slug, deletingSession.id);
      setDeletingSession(null);
      await loadAll();
    } catch (err: unknown) {
      setDeleteError(getDeleteErrorMessage(err));
    } finally {
      setSessionDeleteSubmitting(false);
    }
  };

  const handleDeleteRegistrant = async () => {
    if (!deletingRegistrant) return;
    setRegistrantDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await academyService.deleteRegistrant(slug, deletingRegistrant.id);
      setDeletingRegistrant(null);
      await loadAll();
    } catch (err: unknown) {
      setDeleteError(getDeleteErrorMessage(err));
    } finally {
      setRegistrantDeleteSubmitting(false);
    }
  };

  const copyRegisterLink = async () => {
    try {
      await navigator.clipboard.writeText(registerUrl(slug));
      setRegisterLinkCopied(true);
      setTimeout(() => setRegisterLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — link is still visible to copy manually.
    }
  };

  const copyLink = async (qrToken: string) => {
    try {
      await navigator.clipboard.writeText(checkInUrl(qrToken));
      setCopiedToken(qrToken);
      setTimeout(() => setCopiedToken((current) => (current === qrToken ? null : current)), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — link is still visible to copy manually.
    }
  };

  const openAssignTutor = () => {
    setTutorError(null);
    setTutorNameInput(tutor?.full_name ?? "");
    setTutorEmailInput(tutor?.email ?? "");
    setShowAssignTutor(true);
  };

  const handleAssignTutor = async () => {
    if (!tutorNameInput || !tutorEmailInput) return;
    setTutorSubmitting(true);
    setTutorError(null);
    try {
      const response = await academyService.assignTutor(slug, {
        full_name: tutorNameInput,
        email: tutorEmailInput,
      });
      setTutor(response.data);
      setShowAssignTutor(false);
    } catch {
      setTutorError("Could not assign this tutor. Check the fields and try again.");
    } finally {
      setTutorSubmitting(false);
    }
  };

  const handleResendTutorLink = async () => {
    setResendingTutor(true);
    try {
      await academyService.resendTutorLink(slug);
    } finally {
      setResendingTutor(false);
    }
  };

  const handleRevokeTutor = async () => {
    setTutorRevokeSubmitting(true);
    setDeleteError(null);
    try {
      const response = await academyService.revokeTutor(slug);
      setTutor(response.data);
      setRevokingTutor(false);
    } catch (err: unknown) {
      setDeleteError(getDeleteErrorMessage(err));
    } finally {
      setTutorRevokeSubmitting(false);
    }
  };

  const copyTutorLink = async () => {
    if (!tutor) return;
    try {
      await navigator.clipboard.writeText(tutorPortalUrl(tutor.magic_token));
      setTutorLinkCopied(true);
      setTimeout(() => setTutorLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — link is still visible to copy manually.
    }
  };

  const handleCreateSend = async () => {
    if (!sendUrl) return;
    setSendSubmitting(true);
    setSendError(null);
    try {
      await academyService.createQuestionsLinkSend(slug, {
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
      await loadAll();
    } catch {
      setSendError("Could not send this questions link. Check the URL and try again.");
    } finally {
      setSendSubmitting(false);
    }
  };

  const handleDeleteSend = async () => {
    if (!deletingSend) return;
    setSendDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await academyService.deleteQuestionsLinkSend(slug, deletingSend.id);
      setDeletingSend(null);
      if (viewingSend?.id === deletingSend.id) setViewingSend(null);
      await loadAll();
    } catch (err: unknown) {
      setDeleteError(getDeleteErrorMessage(err));
    } finally {
      setSendDeleteSubmitting(false);
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

  const totalSessions = sessions.length;
  const leaderboard = [...registrants].sort((a, b) => b.sessions_attended - a.sessions_attended);

  if (loading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading class…</div>;
  }

  if (!trainingClass) {
    return <div className="text-center py-16 text-gray-500 text-sm">Class not found.</div>;
  }

  return (
    <div className="space-y-[28px]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/Dashboard/academy")}
          className="text-[13px] font-medium text-[#023E8A]"
        >
          ← Back to classes
        </button>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">
            Training class
          </p>
          <h1 className="text-[24px] font-semibold text-[#181818]">{trainingClass.name}</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Starts {formatDate(trainingClass.start_date)} · {registrants.length}{" "}
            {registrants.length === 1 ? "registrant" : "registrants"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                trainingClass.registration_open
                  ? "border-[#2D9C5E] text-[#2D9C5E] bg-[#2D9C5E1A]"
                  : "border-[#9B9EA4] text-[#67696D] bg-[#F5F5F5]"
              }`}
            >
              Registration {trainingClass.registration_open ? "open" : "closed"}
            </span>
            <button
              type="button"
              onClick={toggleRegistration}
              disabled={togglingRegistration}
              className="rounded-lg border border-[#dfe7f0] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#023E8A] hover:bg-[#F0F4FA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {togglingRegistration
                ? "Saving…"
                : trainingClass.registration_open
                  ? "Close registration"
                  : "Reopen registration"}
            </button>
          </div>
          <button
            type="button"
            onClick={copyRegisterLink}
            className="rounded-lg border border-[#dfe7f0] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#023E8A] hover:bg-[#F0F4FA]"
          >
            {registerLinkCopied ? "Registration link copied ✓" : "Copy registration link"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeletingClass(true);
            }}
            className="text-[11.5px] font-medium text-[#D72638] hover:underline"
          >
            Delete class
          </button>
        </div>
      </div>
      <p className="-mt-4 text-[11px] text-gray-400">
        Share this link directly with participants — it isn't shown anywhere in the product.
      </p>

      {/* Tutor */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#181818]">Tutor</h2>
          {!tutor && !showAssignTutor && (
            <button
              type="button"
              onClick={openAssignTutor}
              className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D]"
            >
              Assign tutor
            </button>
          )}
        </div>

        {showAssignTutor && (
          <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={tutorNameInput}
                  onChange={(e) => setTutorNameInput(e.target.value)}
                  placeholder="Bola Tutor"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={tutorEmailInput}
                  onChange={(e) => setTutorEmailInput(e.target.value)}
                  placeholder="tutor@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              {tutor
                ? "Reassigning issues a fresh access link — the old one stops working immediately."
                : "The tutor gets no dashboard login — just an emailed link scoped to this class."}
            </p>
            {tutorError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {tutorError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAssignTutor}
                disabled={tutorSubmitting || !tutorNameInput || !tutorEmailInput}
                className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tutorSubmitting ? "Saving…" : tutor ? "Update tutor" : "Assign tutor"}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignTutor(false)}
                className="rounded-lg border border-[#dfe7f0] px-4 py-2 text-[12.5px] font-semibold text-[#4E4F52] hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tutor && !showAssignTutor && (
          <div className="rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[#181818]">{tutor.full_name}</p>
              <p className="text-[11px] text-gray-400">{tutor.email}</p>
              {tutor.revoked_at && (
                <span className="mt-1.5 inline-block rounded-full border border-[#9B9EA4] text-[#67696D] bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-semibold">
                  Access revoked
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tutor.revoked_at ? (
                <button
                  type="button"
                  onClick={openAssignTutor}
                  className="rounded-lg border border-[#dfe7f0] px-3 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                >
                  Reassign tutor
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={copyTutorLink}
                    className="rounded-lg border border-[#dfe7f0] px-3 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                  >
                    {tutorLinkCopied ? "Portal link copied ✓" : "Copy portal link"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendTutorLink}
                    disabled={resendingTutor}
                    className="rounded-lg border border-[#dfe7f0] px-3 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendingTutor ? "Sending…" : "Resend link"}
                  </button>
                  <button
                    type="button"
                    onClick={openAssignTutor}
                    className="rounded-lg border border-[#dfe7f0] px-3 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                  >
                    Change tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null);
                      setRevokingTutor(true);
                    }}
                    className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-[#D72638] hover:bg-red-50"
                  >
                    Revoke access
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {!tutor && !showAssignTutor && (
          <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
            No tutor assigned yet.
          </div>
        )}
      </section>

      {/* Sessions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#181818]">
            Sessions ({sessions.length})
          </h2>
          <button
            type="button"
            onClick={() => setShowNewSession((v) => !v)}
            className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D]"
          >
            {showNewSession ? "Cancel" : "New Session"}
          </button>
        </div>

        {showNewSession && (
          <div className="rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Label
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Week 1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Start time
                </label>
                <input
                  type="time"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                  Check-in window (min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={windowMinutes}
                  onChange={(e) => setWindowMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {sessionDate && sessionTime && (
              <p className="text-[12px] text-gray-500">
                Will start:{" "}
                <strong className="text-[#181818]">
                  {new Date(`${sessionDate}T${sessionTime}:00`).toLocaleString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </strong>{" "}
                — double-check AM/PM before creating.
              </p>
            )}
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreateSession}
              disabled={submitting || !label || !sessionDate}
              className="rounded-lg bg-[#023E8A] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#012A5D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create session"}
            </button>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
            No sessions yet. Add the first one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="relative rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm space-y-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingSession(session);
                  }}
                  className="absolute top-3 right-3 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-[#D72638]"
                  aria-label={`Delete ${session.label}`}
                >
                  ✕
                </button>
                <div className="flex items-start justify-between gap-2 pr-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#023E8A]">
                      {session.label}
                    </p>
                    <p className="text-[12px] text-gray-500">{formatDateTime(session.session_start_at)}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${windowBadgeClass[session.window_status]}`}
                  >
                    {windowBadgeLabel[session.window_status]}
                  </span>
                </div>

                <p className="text-[11px] text-gray-400">
                  Check-in window: {session.checkin_window_minutes} min · closes{" "}
                  {formatDateTime(session.checkin_closes_at)}
                </p>

                <div className="flex items-center gap-3">
                  <SessionQr qrToken={session.qr_token} />
                  <div>
                    <p className="text-[22px] font-bold text-[#181818] leading-none">
                      {session.present_count}
                    </p>
                    <p className="text-[11px] text-gray-500">checked in</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(session.qr_token)}
                    className="flex-1 rounded-lg border border-[#dfe7f0] px-2.5 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                  >
                    {copiedToken === session.qr_token ? "Link copied ✓" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadQr(session)}
                    className="flex-1 rounded-lg border border-[#dfe7f0] px-2.5 py-1.5 text-[11px] font-medium text-[#023E8A] hover:bg-[#F0F4FA]"
                  >
                    Download QR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Questions links */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#181818]">
            Questions links ({questionsLinkSends.length})
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
                  Registrants can still view the link after this passes, but can no longer submit
                  or resubmit.
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

        {questionsLinkSends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
            No questions links sent yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {questionsLinkSends.map((send) => (
              <div
                key={send.id}
                className="relative rounded-xl border border-[#dfe7f0] bg-white p-4 shadow-sm space-y-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeletingSend(send);
                  }}
                  className="absolute top-3 right-3 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-[#D72638]"
                  aria-label={`Delete ${send.title || "questions link"}`}
                >
                  ✕
                </button>
                <div className="pr-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#023E8A]">
                    {send.title || "Questions link"}
                  </p>
                  <p className="text-[12px] text-gray-500">{scopeLabel(send)}</p>
                  {send.deadline_at && (
                    <p
                      className={`mt-1 text-[11px] font-medium ${send.is_past_deadline ? "text-[#D72638]" : "text-gray-500"}`}
                    >
                      {send.is_past_deadline ? "Deadline passed: " : "Due "}
                      {formatDeadline(send.deadline_at)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-[22px] font-bold text-[#181818] leading-none">
                    {send.submission_count}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    submitted · sent by {send.sent_by}
                  </p>
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

      {/* Registrants */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#181818]">
            Registrants ({registrants.length})
          </h2>
          <span className="text-[12px] text-gray-500">
            {registrants.filter((r) => r.marketing_opt_in).length} opted in to marketing
          </span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#dfe7f0] bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-[#dfe7f0]">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Marketing
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Attendance
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {registrants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No registrants yet.
                  </td>
                </tr>
              ) : (
                registrants.map((r) => (
                  <tr key={r.id} className="border-b border-[#dfe7f0] last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#181818]">{r.full_name}</p>
                      <p className="text-[11px] text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono text-[#181818]">{r.student_id}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-600">{r.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                          r.marketing_opt_in
                            ? "border-[#2D9C5E] text-[#2D9C5E] bg-[#2D9C5E1A]"
                            : "border-[#9B9EA4] text-[#67696D] bg-[#F5F5F5]"
                        }`}
                      >
                        {r.marketing_opt_in ? "Opted in" : "Not opted in"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {sessions.map((s) => (
                          <span
                            key={s.id}
                            title={s.label}
                            className={`h-2.5 w-2.5 rounded-full ${
                              r.attended_session_ids.includes(s.id) ? "bg-[#2D9C5E]" : "bg-[#DADCE0]"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingRegistrant(r);
                        }}
                        className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-[#D72638]"
                        aria-label={`Delete ${r.full_name}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Awards leaderboard */}
      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold text-[#181818]">Awards leaderboard</h2>
        {leaderboard.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-8 text-center text-sm text-gray-500">
            No attendance recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((r, index) => {
              const isTop = index < 3;
              const isPerfect = totalSessions > 0 && r.sessions_attended === totalSessions;
              return (
                <div
                  key={r.id}
                  className={`grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl border p-4 shadow-sm ${
                    isTop ? "border-[#B9CDEB] bg-[#F0F4FA]" : "border-[#dfe7f0] bg-white"
                  }`}
                >
                  <p className={`text-center text-[15px] font-bold ${isTop ? "text-[#023E8A]" : "text-gray-400"}`}>
                    {index + 1}
                  </p>
                  <div>
                    <p className="text-[14px] font-semibold text-[#181818]">
                      {r.full_name}
                      {isPerfect && (
                        <span className="ml-2 rounded-full bg-[#EC5312] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Perfect attendance
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">{r.student_id}</p>
                  </div>
                  <p className={`text-[13px] font-bold ${isTop ? "text-[#023E8A]" : "text-gray-600"}`}>
                    {r.sessions_attended} / {totalSessions}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {deletingClass && (
        <ConfirmDeleteModal
          title={`Delete "${trainingClass.name}"?`}
          description={`This permanently deletes the class, all ${sessions.length} of its sessions, every registrant's enrollment, and all attendance records. This cannot be undone.`}
          confirmPhrase={trainingClass.name}
          loading={classDeleteSubmitting}
          error={deleteError}
          onConfirm={handleDeleteClass}
          onCancel={() => {
            setDeleteError(null);
            setDeletingClass(false);
          }}
        />
      )}

      {deletingSession && (
        <ConfirmDeleteModal
          title={`Delete "${deletingSession.label}"?`}
          description={`This permanently deletes this session and its ${deletingSession.present_count} attendance record${deletingSession.present_count === 1 ? "" : "s"}. Registrants and the rest of the class are unaffected. This cannot be undone.`}
          confirmPhrase={deletingSession.label}
          loading={sessionDeleteSubmitting}
          error={deleteError}
          onConfirm={handleDeleteSession}
          onCancel={() => {
            setDeleteError(null);
            setDeletingSession(null);
          }}
        />
      )}

      {deletingRegistrant && (
        <ConfirmDeleteModal
          title={`Delete "${deletingRegistrant.full_name}"?`}
          description={`This permanently removes this registrant (${deletingRegistrant.email}) and their attendance records from this class. This does not affect any other class they may be registered for. This cannot be undone.`}
          confirmPhrase={deletingRegistrant.email}
          loading={registrantDeleteSubmitting}
          error={deleteError}
          onConfirm={handleDeleteRegistrant}
          onCancel={() => {
            setDeleteError(null);
            setDeletingRegistrant(null);
          }}
        />
      )}

      {revokingTutor && tutor && (
        <ConfirmDeleteModal
          title={`Revoke access for "${tutor.full_name}"?`}
          description={`Their current portal link (${tutorPortalUrl(tutor.magic_token)}) will stop working immediately. Nothing they already sent or that was submitted is deleted — reassigning them (or a new tutor) later issues a fresh link.`}
          confirmPhrase={tutor.email}
          loading={tutorRevokeSubmitting}
          error={deleteError}
          onConfirm={handleRevokeTutor}
          onCancel={() => {
            setDeleteError(null);
            setRevokingTutor(false);
          }}
        />
      )}

      {deletingSend && (
        <ConfirmDeleteModal
          title={`Delete "${deletingSend.title || "this questions link"}"?`}
          description={`This permanently removes the link and its ${deletingSend.submission_count} submission${deletingSend.submission_count === 1 ? "" : "s"}. Anyone who already has the link can no longer view or submit through it. This cannot be undone.`}
          confirmPhrase={deletingSend.title || "this questions link"}
          loading={sendDeleteSubmitting}
          error={deleteError}
          onConfirm={handleDeleteSend}
          onCancel={() => {
            setDeleteError(null);
            setDeletingSend(null);
          }}
        />
      )}

      {viewingSend && (
        <AssignmentSubmissionsModal
          slug={slug}
          send={viewingSend}
          onClose={() => setViewingSend(null)}
        />
      )}
    </div>
  );
}
