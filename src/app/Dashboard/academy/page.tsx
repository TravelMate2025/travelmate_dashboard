"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import academyService from "@/services/academy";
import type { TrainingClass } from "@/services/academy/types";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function AcademyClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<TrainingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingClass, setDeletingClass] = useState<TrainingClass | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await academyService.getClasses();
      setClasses(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setSlugTouched(false);
    setStartDate("");
    setDescription("");
    setError(null);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await academyService.createClass({
        name,
        slug,
        start_date: startDate,
        description: description || undefined,
      });
      setShowCreate(false);
      resetForm();
      await loadClasses();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string; slug?: string[] } } })?.response?.data
          ?.error ||
        (err as { response?: { data?: { slug?: string[] } } })?.response?.data?.slug?.[0] ||
        "Could not create this class. Check the fields and try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    setDeleteSubmitting(true);
    try {
      await academyService.deleteClass(deletingClass.slug);
      setDeletingClass(null);
      await loadClasses();
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-[24px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#023E8A]">
            Training
          </p>
          <h1 className="text-[24px] font-semibold text-[#181818]">Classes</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-[#023E8A] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#012A5D]"
        >
          {showCreate ? "Cancel" : "New Class"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-[#dfe7f0] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-[16px] font-semibold text-[#181818]">New training class</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="AI Video Training — Nov 2026"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                URL slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugTouched(true);
                }}
                placeholder="ai-video-training-nov-2026"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-[11px] text-gray-500">Used in the registration link.</p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                Start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#4E4F52] mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting || !name || !slug || !startDate}
            className="rounded-lg bg-[#023E8A] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#012A5D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create class"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading classes…</div>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#dfe7f0] bg-white p-10 text-center text-sm text-gray-500">
          No training classes yet. Create the first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/Dashboard/academy/${cls.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") router.push(`/Dashboard/academy/${cls.slug}`);
              }}
              className="relative text-left rounded-xl border border-[#dfe7f0] bg-white p-5 shadow-sm transition hover:border-[#023E8A] hover:shadow-md cursor-pointer"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingClass(cls);
                }}
                className="absolute top-3 right-3 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-[#D72638]"
                aria-label={`Delete ${cls.name}`}
              >
                ✕
              </button>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#023E8A]">
                {new Date(cls.start_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <h3 className="mt-1 pr-6 text-[16px] font-semibold text-[#181818]">{cls.name}</h3>
              {cls.description && (
                <p className="mt-1 text-[13px] text-gray-500 line-clamp-2">{cls.description}</p>
              )}
              <div className="mt-4 flex gap-4 text-[12px] text-gray-500">
                <span>
                  <strong className="text-[#181818]">{cls.session_count}</strong>{" "}
                  {cls.session_count === 1 ? "session" : "sessions"}
                </span>
                <span>
                  <strong className="text-[#181818]">{cls.registrant_count}</strong>{" "}
                  {cls.registrant_count === 1 ? "registrant" : "registrants"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {deletingClass && (
        <ConfirmDeleteModal
          title={`Delete "${deletingClass.name}"?`}
          description={`This permanently deletes the class, all ${deletingClass.session_count} of its sessions, every registrant's enrollment, and all attendance records. This cannot be undone.`}
          confirmPhrase={deletingClass.name}
          loading={deleteSubmitting}
          onConfirm={handleDeleteClass}
          onCancel={() => setDeletingClass(null)}
        />
      )}
    </div>
  );
}
