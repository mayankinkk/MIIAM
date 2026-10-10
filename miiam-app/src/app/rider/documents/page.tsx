"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PullToRefresh from "@/components/PullToRefresh";

interface RiderDocument {
  id: string;
  doc_type: string;
  document_number: string | null;
  document_url: string | null;
  expiry_date: string | null;
  status: string;
  created_at: string;
}

const documentTypes = [
  { type: "driving_license", name: "Driving License", icon: "badge", required: true },
  { type: "vehicle_rc", name: "Vehicle Registration (RC)", icon: "directions_car", required: true },
  { type: "aadhaar", name: "Aadhaar Card", icon: "credit_card", required: true },
  { type: "pan", name: "PAN Card", icon: "account_balance", required: false },
  { type: "bank_passbook", name: "Bank Passbook / Statement", icon: "book", required: false },
  {
    type: "police_clearance",
    name: "Police Clearance Certificate",
    icon: "verified_user",
    required: false,
  },
];

export default function RiderDocumentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRiderAndDocuments();
  }, []);

  async function loadRiderAndDocuments() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setRiderId(user.id);

      const { data: rider } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (rider) {
        const { data: docs } = await supabase
          .from("rider_documents")
          .select("*")
          .eq("rider_id", rider.id)
          .order("created_at", { ascending: false });

        setDocuments(docs || []);
      }
    } catch {
      setDataError("Couldn't load documents. Pull down to try again.");
    }
    setLoading(false);
  }

  async function handleUpload() {
    if (!selectedFile || !selectedDocType || !riderId) {
      setError("Please fill all required fields");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("rider_id", riderId);
      formData.append("doc_type", selectedDocType);
      formData.append("document_number", docNumber);
      formData.append("expiry_date", expiryDate);
      formData.append("file", selectedFile);

      const res = await fetch("/api/rider/documents", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setSuccess("Document uploaded successfully! Pending verification.");
      setShowUploadModal(false);
      resetForm();
      loadRiderAndDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }

    setUploading(false);
  }

  function resetForm() {
    setSelectedDocType("");
    setDocNumber("");
    setExpiryDate("");
    setSelectedFile(null);
  }

  function getDocStatus(docType: string): { status: string; doc?: RiderDocument } {
    const doc = documents.find((d) => d.doc_type === docType);
    if (!doc) return { status: "missing" };
    return { status: doc.status, doc };
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-[var(--color-surface-container)] text-[var(--color-outline)]";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-container-lowest)]">
        <div className="border-brand-secondary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        setDataError(null);
        setLoading(true);
        await loadRiderAndDocuments();
      }}
    >
      <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
        {dataError && (
          <div className="fixed top-4 right-4 left-4 z-50 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 shadow-lg">
            <span className="material-symbols-outlined text-red-600">wifi_off</span>
            <p className="flex-1 text-sm text-red-700">{dataError}</p>
            <button
              onClick={() => {
                setDataError(null);
                loadRiderAndDocuments();
              }}
              className="text-sm font-bold text-red-700"
            >
              Retry
            </button>
          </div>
        )}
        <header className="bg-brand-secondary rounded-b-[3rem] p-6 pb-8 text-white">
          <div className="flex items-center gap-4">
            <Link href="/rider/account" className="text-white" aria-label="Go back">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tighter">Documents</h1>
          </div>
          <p className="mt-2 text-sm text-white/70">Upload and manage your documents</p>
        </header>

        <main className="space-y-6 p-6 pb-32">
          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                check_circle
              </span>
              <p className="flex-1 text-sm text-green-700 dark:text-green-300">{success}</p>
              <button onClick={() => setSuccess(null)} aria-label="Dismiss">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400">
                  close
                </span>
              </button>
            </div>
          )}

          <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <h2 className="mb-4 font-bold text-[var(--color-on-surface)]">Required Documents</h2>
            <div className="space-y-3">
              {documentTypes.map((doc) => {
                const { status, doc: existingDoc } = getDocStatus(doc.type);
                return (
                  <div
                    key={doc.type}
                    className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          status === "verified"
                            ? "bg-green-100"
                            : status === "pending"
                              ? "bg-amber-100"
                              : "bg-[var(--color-surface-container-high)]"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            status === "verified"
                              ? "text-green-600"
                              : status === "pending"
                                ? "text-amber-600"
                                : "text-[var(--color-outline)]"
                          }`}
                        >
                          {doc.icon}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-on-surface)]">{doc.name}</p>
                        {existingDoc?.document_number && (
                          <p className="text-xs text-[var(--color-outline)]">
                            {existingDoc.document_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(status)}`}
                      >
                        {status}
                      </span>
                      {(status === "missing" || status === "rejected") && (
                        <button
                          onClick={() => {
                            setSelectedDocType(doc.type);
                            setShowUploadModal(true);
                          }}
                          className="bg-brand-secondary rounded-full p-2 text-white"
                          aria-label="Upload document"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {documents.length > 0 && (
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
              <h2 className="mb-4 font-bold text-[var(--color-on-surface)]">Recently Uploaded</h2>
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.document_url || "#"}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-subtle)] p-3 hover:bg-[var(--color-surface-container)]"
                  >
                    <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                      description
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--color-on-surface)]">
                        {doc.doc_type.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-[var(--color-outline)]">
                        {new Date(doc.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${getStatusColor(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                info
              </span>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Document Verification
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Upload clear images. Documents are verified within 24-48 hours. Keep documents
                  updated before expiry to continue accepting orders.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 dark:bg-accent/20 border-accent/40 dark:border-accent/40 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-accent">security</span>
              <div>
                <p className="text-accent dark:text-accent text-sm font-bold">Your Data is Safe</p>
                <p className="text-accent mt-1 text-xs">
                  Documents are encrypted and stored securely. We comply with DPDP Act 2023 and
                  never share your data with third parties.
                </p>
              </div>
            </div>
          </div>
        </main>

        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
            <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl dark:bg-[var(--color-surface)]">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black text-[var(--color-on-surface)]">
                  Upload Document
                </h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  className="p-2"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                    Document Type *
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full rounded-xl bg-[var(--color-surface-container)] p-4 font-bold"
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map((doc) => (
                      <option key={doc.type} value={doc.type}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                    Document Number *
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Enter document number"
                    className="w-full rounded-xl bg-[var(--color-surface-container)] p-4 font-bold"
                  />
                </div>

                {selectedDocType !== "aadhaar" && selectedDocType !== "pan" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full rounded-xl bg-[var(--color-surface-container)] p-4 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-bold text-[var(--color-on-surface)]">
                    Upload Document *
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:border-brand-secondary cursor-pointer rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] p-8 text-center"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-green-600">
                          check_circle
                        </span>
                        <span className="font-bold text-[var(--color-on-surface)]">
                          {selectedFile.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)]">
                          upload_file
                        </span>
                        <p className="mt-2 text-sm text-[var(--color-outline)]">
                          Tap to upload (JPEG, PNG, PDF)
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-outline-variant)]">Max 5MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedDocType || !docNumber}
                className="bg-brand-secondary mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">upload</span>
                    Submit Document
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
