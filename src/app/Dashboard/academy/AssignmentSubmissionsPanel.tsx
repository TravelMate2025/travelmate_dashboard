"use client";
import { useEffect, useState } from "react";
import academyService from "@/services/academy";
import type { AssignmentSubmission } from "@/services/academy/types";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

type AssignmentSubmissionsPanelProps = {
  slug: string;
  sendId: string;
};

// Self-fetching, same shape as SessionQr in [slug]/page.tsx -- only
// loads once the parent card is expanded to "View submissions", not
// eagerly for every send on the page.
export function AssignmentSubmissionsPanel({ slug, sendId }: AssignmentSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSubmissions(null);
    academyService.getSubmissions(slug, sendId).then((response) => {
      if (!cancelled) setSubmissions(response.data.results);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, sendId]);

  if (submissions === null) {
    return <p className="text-[12px] text-gray-400">Loading submissions…</p>;
  }

  if (submissions.length === 0) {
    return <p className="text-[12px] text-gray-400">No submissions yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#dfe7f0] bg-white shadow-sm">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr className="border-b border-[#dfe7f0]">
            <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
              Student
            </th>
            <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
              Student ID
            </th>
            <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
              Assignment link
            </th>
            <th className="px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-b border-[#dfe7f0] last:border-0 hover:bg-gray-50">
              <td className="px-3 py-2">
                <p className="text-[12.5px] font-medium text-[#181818]">{s.full_name}</p>
                <p className="text-[10.5px] text-gray-400">{s.email}</p>
              </td>
              <td className="px-3 py-2 text-[12.5px] font-mono text-[#181818]">{s.student_id}</td>
              <td className="px-3 py-2">
                <a
                  href={s.assignment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12.5px] text-[#023E8A] hover:underline break-all"
                >
                  {s.assignment_link}
                </a>
              </td>
              <td className="px-3 py-2 text-[12px] text-gray-500 whitespace-nowrap">
                {formatDateTime(s.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
