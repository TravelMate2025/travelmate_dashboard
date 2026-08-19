"use client";
import { useEffect, useState } from "react";
import { getTutorSubmissions, AssignmentSubmission, QuestionsLinkSend } from "@/services/academyTutor/api";

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

type TutorSubmissionsModalProps = {
  token: string;
  send: QuestionsLinkSend;
  onClose: () => void;
};

// Modal rather than an inline expand within the (narrow, grid-column)
// send card -- same fix as the admin dashboard's AssignmentSubmissionsModal,
// and kept as its own copy for the same reason the old panel was: this
// route must never touch the authenticated academyService client. Search
// + "Load more" pagination mirror that same admin modal exactly -- the
// backend endpoint is shared (SubmissionsListBaseView), so both already
// support ?search=/?page=/?page_size=, this was purely missing UI here.
export function TutorSubmissionsModal({ token, send, onClose }: TutorSubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSubmissions(null);
    setPage(1);
    const handle = setTimeout(() => {
      getTutorSubmissions(token, send.id, {
        search: search.trim() || undefined,
        page: 1,
        pageSize: PAGE_SIZE,
      }).then((response) => {
        if (cancelled) return;
        setSubmissions(response.data.results);
        setTotalCount(response.data.count);
        setHasMore(response.data.next !== null);
      });
    }, search ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [token, send.id, search]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await getTutorSubmissions(token, send.id, {
        search: search.trim() || undefined,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setSubmissions((current) => [...(current ?? []), ...response.data.results]);
      setPage(nextPage);
      setHasMore(response.data.next !== null);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-[680px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#dfe7f0] p-5">
          <div>
            <h2 className="text-[16px] font-semibold text-[#181818]">
              {send.title || "Questions link"} — submissions
            </h2>
            <p className="mt-0.5 text-[12.5px] text-gray-500">
              {send.submission_count} submitted
              {send.deadline_at && (
                <>
                  {" · "}
                  <span className={send.is_past_deadline ? "text-[#D72638] font-medium" : ""}>
                    {send.is_past_deadline ? "deadline passed" : "due"} {formatDateTime(send.deadline_at)}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-[#181818]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-[#dfe7f0] p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or student ID…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-y-auto p-4">
          {submissions === null ? (
            <p className="py-6 text-center text-[12.5px] text-gray-400">Loading submissions…</p>
          ) : submissions.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-gray-400">
              {search ? "No submissions match your search." : "No submissions yet."}
            </p>
          ) : (
            <>
              <div className="space-y-1">
                {submissions.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1 border-b border-[#dfe7f0] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#181818]">{s.full_name}</p>
                      <p className="text-[11px] text-gray-400">
                        {s.email} · <span className="font-mono">{s.student_id}</span>
                      </p>
                      <a
                        href={s.assignment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-[12.5px] text-[#023E8A] hover:underline"
                      >
                        {s.assignment_link}
                      </a>
                    </div>
                    <p className="shrink-0 text-[11px] text-gray-500 whitespace-nowrap">
                      {formatDateTime(s.updated_at)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col items-center gap-2">
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="rounded-lg border border-[#dfe7f0] px-4 py-1.5 text-[12px] font-medium text-[#023E8A] hover:bg-[#F0F4FA] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
                {totalCount !== null && (
                  <p className="text-[11px] text-gray-400">
                    Showing {submissions.length} of {totalCount}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
