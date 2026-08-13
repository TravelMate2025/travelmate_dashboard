"use client";
import { useState } from "react";

type ConfirmDeleteModalProps = {
  title: string;
  description: string;
  confirmPhrase: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Serious, hard-delete action -- the organizer must type the exact name
// back to enable the button. Deliberately a hard delete, not a soft
// hide/archive: an empty test class/session shouldn't sit in the DB
// forever just because deleting felt risky.
export function ConfirmDeleteModal({
  title,
  description,
  confirmPhrase,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === confirmPhrase;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-semibold text-[#181818]">{title}</h2>
        <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">{description}</p>
        <p className="mt-4 text-[12px] font-semibold text-[#4E4F52]">
          Type <span className="font-mono text-[#D72638]">{confirmPhrase}</span> to confirm.
        </p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoFocus
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#dfe7f0] px-3.5 py-2 text-[12.5px] font-semibold text-[#4E4F52] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!matches || loading}
            className="rounded-lg bg-[#D72638] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#B81F2F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
