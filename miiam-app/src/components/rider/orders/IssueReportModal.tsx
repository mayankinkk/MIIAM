"use client";

interface IssueReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (issueType: string) => void;
}

const ISSUE_TYPES = ["Wrong Items", "Store Closed", "Customer Unreachable", "Safety Concern", "Other"];

export default function IssueReportModal({ open, onClose, onSubmit }: IssueReportModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-xl mb-4">Report Issue</h3>
        <div className="space-y-2">
          {ISSUE_TYPES.map(issue => (
            <button
              key={issue}
              onClick={() => onSubmit(issue)}
              className="w-full p-3 text-left bg-[var(--color-surface-subtle)] rounded-xl font-bold hover:bg-[var(--color-surface-container)]"
            >
              {issue}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 text-[var(--color-outline)] font-bold">Cancel</button>
      </div>
    </div>
  );
}
