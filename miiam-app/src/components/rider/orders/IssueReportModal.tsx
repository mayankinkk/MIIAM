"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface IssueReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (issueType: string) => void;
}

const ISSUE_TYPES = [
  "Wrong Items",
  "Store Closed",
  "Customer Unreachable",
  "Safety Concern",
  "Other",
];

export default function IssueReportModal({ open, onClose, onSubmit }: IssueReportModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-report-title"
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6"
      >
        <h3 id="issue-report-title" className="mb-4 text-xl font-bold">
          Report Issue
        </h3>
        <div className="space-y-2">
          {ISSUE_TYPES.map((issue) => (
            <button
              key={issue}
              onClick={() => onSubmit(issue)}
              className="w-full rounded-xl bg-[var(--color-surface-subtle)] p-3 text-left font-bold hover:bg-[var(--color-surface-container)]"
            >
              {issue}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-3 font-bold text-[var(--color-outline)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
