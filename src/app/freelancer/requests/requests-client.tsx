"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  IconInbox,
  IconCheck,
  IconX,
  IconEye,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { acceptRequest, rejectRequest } from "./actions";
import { RequestDetailModal, RejectModal } from "./request-modals";
import type { ProjectRequestRow } from "./types";

type FilterStatus = "all" | "pending" | "accepted" | "rejected";

interface RequestsClientProps {
  requests: ProjectRequestRow[];
  fetchError: string | null;
  initialFilter: FilterStatus;
}

export default function RequestsClient({
  requests: initialRequests,
  fetchError,
  initialFilter,
}: RequestsClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter] = useState<FilterStatus>(initialFilter);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequestRow | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const clientName = (request: ProjectRequestRow) =>
    request.client?.full_name || "Unknown Client";

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      try {
        await acceptRequest(requestId);
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: "accepted" } : r))
        );
        setSelectedRequest(null);
        setActionMessage({ type: "success", text: "Project accepted. Workspace created." });
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setActionMessage({ type: "error", text: `Failed to accept: ${message}` });
      }
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    startTransition(async () => {
      try {
        await rejectRequest(selectedRequest.id, rejectMessage);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id ? { ...r, status: "rejected" } : r
          )
        );
        setSelectedRequest(null);
        setShowRejectModal(false);
        setRejectMessage("");
        setActionMessage({ type: "success", text: "Project request rejected." });
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setActionMessage({ type: "error", text: `Failed to reject: ${message}` });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning">Pending</span>;
      case "accepted":
        return <span className="badge badge-success">Accepted</span>;
      case "rejected":
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Project Requests</h1>
        <p className="text-sm text-text-secondary">
          Review and manage incoming client project requests.
        </p>
      </header>

      {fetchError && (
        <div className="card border-status-danger/30 bg-red-50 text-status-danger text-sm">
          <strong>Could not load requests:</strong> {fetchError}
        </div>
      )}

      {actionMessage && (
        <div
          className={`card text-sm ${
            actionMessage.type === "success"
              ? "bg-brand-tint text-brand-dark"
              : "bg-red-50 text-status-danger"
          }`}
        >
          {actionMessage.text}
          <button
            type="button"
            className="ml-3 underline text-[12px]"
            onClick={() => setActionMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "accepted", "rejected"] as FilterStatus[]).map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/freelancer/requests" : `/freelancer/requests?status=${s}`}
            className={`px-3 py-1.5 rounded-medium text-[12px] font-medium transition-colors ${
              filter === s
                ? "bg-brand-dark text-white"
                : "bg-brand-surface text-text-secondary hover:bg-brand-tint"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1 opacity-70">
                ({requests.filter((r) => r.status === s).length})
              </span>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2">
          <IconInbox size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">
            {filter === "pending" ? "No pending requests" : "No project requests yet"}
          </p>
          <p className="text-text-tertiary text-sm mt-2">
            When clients submit projects, they appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((request) => (
            <div key={request.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[15px] font-medium text-brand-dark">
                      {request.form_data?.project_name || "Untitled Project"}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-[13px] text-text-secondary mb-1">
                    <strong>Client:</strong> {clientName(request)}
                  </p>
                  <p className="text-[12px] text-text-tertiary">
                    <strong>Type:</strong> {request.form_data?.project_type || "Not specified"} ·
                    <strong className="ml-2">Budget:</strong>{" "}
                    {request.form_data?.budget_range || "Not specified"} ·
                    <strong className="ml-2">Submitted:</strong>{" "}
                    {new Date(request.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(request)}
                        className="pill-btn-outline text-[12px] px-3 py-1.5"
                      >
                        <IconEye size={16} />
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccept(request.id)}
                        disabled={isPending}
                        className="pill-btn bg-brand-mid hover:bg-brand-green text-white text-[12px] px-3 py-1.5 disabled:opacity-50"
                      >
                        <IconCheck size={16} />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        disabled={isPending}
                        className="pill-btn bg-status-danger hover:opacity-90 text-white text-[12px] px-3 py-1.5 disabled:opacity-50"
                      >
                        <IconX size={16} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && !showRejectModal && (
        <RequestDetailModal
          request={selectedRequest}
          clientName={clientName(selectedRequest)}
          isPending={isPending}
          onClose={() => setSelectedRequest(null)}
          onAccept={() => handleAccept(selectedRequest.id)}
          onReject={() => setShowRejectModal(true)}
        />
      )}

      {showRejectModal && selectedRequest && (
        <RejectModal
          rejectMessage={rejectMessage}
          isPending={isPending}
          onChangeMessage={setRejectMessage}
          onCancel={() => {
            setShowRejectModal(false);
            setRejectMessage("");
          }}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}
