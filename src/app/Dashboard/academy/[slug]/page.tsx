"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import env from "@/config/env";
import academyService from "@/services/academy";
import type { ClassSession, Registrant, TrainingClass } from "@/services/academy/types";
import { ConfirmDeleteModal } from "../ConfirmDeleteModal";

const WEB_FRONTEND_URL = env.links.USER_FRONTEND_URL || "https://localhost:3000";

const checkInUrl = (qrToken: string) => `${WEB_FRONTEND_URL}/academy/checkin/${qrToken}`;
const registerUrl = (classSlug: string) => `${WEB_FRONTEND_URL}/academy/${classSlug}/register`;

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, sessionsRes, registrantsRes] = await Promise.all([
        academyService.getClass(slug),
        academyService.getSessions(slug),
        academyService.getRegistrants(slug),
      ]);
      setTrainingClass(classRes.data);
      setSessions(sessionsRes.data);
      setRegistrants(registrantsRes.data);
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

  const handleDeleteClass = async () => {
    setClassDeleteSubmitting(true);
    try {
      await academyService.deleteClass(slug);
      router.push("/Dashboard/academy");
    } finally {
      setClassDeleteSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    setSessionDeleteSubmitting(true);
    try {
      await academyService.deleteSession(slug, deletingSession.id);
      setDeletingSession(null);
      await loadAll();
    } finally {
      setSessionDeleteSubmitting(false);
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
            onClick={() => setDeletingClass(true)}
            className="text-[11.5px] font-medium text-[#D72638] hover:underline"
          >
            Delete class
          </button>
        </div>
      </div>
      <p className="-mt-4 text-[11px] text-gray-400">
        Share this link directly with participants — it isn't shown anywhere in the product.
      </p>

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
                  onClick={() => setDeletingSession(session)}
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
              </tr>
            </thead>
            <tbody>
              {registrants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
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
          onConfirm={handleDeleteClass}
          onCancel={() => setDeletingClass(false)}
        />
      )}

      {deletingSession && (
        <ConfirmDeleteModal
          title={`Delete "${deletingSession.label}"?`}
          description={`This permanently deletes this session and its ${deletingSession.present_count} attendance record${deletingSession.present_count === 1 ? "" : "s"}. Registrants and the rest of the class are unaffected. This cannot be undone.`}
          confirmPhrase={deletingSession.label}
          loading={sessionDeleteSubmitting}
          onConfirm={handleDeleteSession}
          onCancel={() => setDeletingSession(null)}
        />
      )}
    </div>
  );
}
