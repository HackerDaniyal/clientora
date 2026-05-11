"use client";

import React, { useEffect, useState } from "react";
import { IconInbox, IconCheck, IconX, IconEye, IconAlertCircle } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { acceptRequest, rejectRequest } from "./actions";

interface ProjectRequest {
  id: string;
  client_id: string;
  status: string;
  form_data: any;
  submitted_at: string;
  responded_at: string | null;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRequest | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchRequests();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('project-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_requests',
        },
        (payload) => {
          console.log('New request received!', payload);
          fetchRequests(); // Refresh requests
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('project_requests')
      .select(`
        *,
        profiles:client_id(full_name)
      `)
      .eq('freelancer_id', user?.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(true);
    try {
      const result = await acceptRequest(requestId);
      console.log('Accept result:', result);
      
      // Force page refresh to show updated data
      router.refresh();
      
      // Also fetch fresh data
      await fetchRequests();
      setSelectedRequest(null);
      alert('Project accepted! Workspace created successfully.');
    } catch (error: any) {
      console.error('Accept error:', error);
      alert('Failed to accept request: ' + (error.message || 'Unknown error'));
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      const result = await rejectRequest(selectedRequest.id, rejectMessage);
      console.log('Reject result:', result);
      await fetchRequests();
      setSelectedRequest(null);
      setShowRejectModal(false);
      setRejectMessage("");
      alert('Project rejected.');
    } catch (error: any) {
      console.error('Reject error:', error);
      alert('Failed to reject request: ' + (error.message || 'Unknown error'));
    }
    setActionLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-amber-100 text-amber-700 text-[10px]">Pending</span>;
      case 'accepted':
        return <span className="badge bg-green-100 text-green-700 text-[10px]">Accepted</span>;
      case 'rejected':
        return <span className="badge bg-red-100 text-red-700 text-[10px]">Rejected</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-text-secondary">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Project Requests</h1>
        <p className="text-sm text-text-secondary">Review and manage incoming client project requests.</p>
      </header>

      {requests.length === 0 ? (
        <div className="card text-center py-16 border-dashed border-2">
          <IconInbox size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">No project requests yet</p>
          <p className="text-text-tertiary text-sm mt-2">When clients submit projects, they'll appear here in realtime.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[15px] font-medium text-brand-dark">
                      {request.form_data?.project_name || 'Untitled Project'}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-[13px] text-text-secondary mb-1">
                    <strong>Client:</strong> {request.profiles?.full_name || 'Unknown'}
                  </p>
                  <p className="text-[12px] text-text-tertiary">
                    <strong>Type:</strong> {request.form_data?.project_type || 'Not specified'} · 
                    <strong className="ml-2">Budget:</strong> {request.form_data?.budget_range || 'Not specified'} · 
                    <strong className="ml-2">Submitted:</strong> {new Date(request.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="pill-btn-outline text-[12px] px-3 py-1.5"
                      >
                        <IconEye size={16} />
                        Review
                      </button>
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={actionLoading}
                        className="pill-btn bg-green-500 hover:bg-green-600 text-white text-[12px] px-3 py-1.5 disabled:opacity-50"
                      >
                        <IconCheck size={16} />
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading}
                        className="pill-btn bg-red-500 hover:bg-red-600 text-white text-[12px] px-3 py-1.5 disabled:opacity-50"
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

      {/* Request Detail Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-brand-dark">Project Request Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-brand-light/30 rounded-lg"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Project Info */}
              <div>
                <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">Project Information</h3>
                <div className="bg-brand-surface rounded-lg p-4 space-y-2">
                  <p><strong>Name:</strong> {selectedRequest.form_data?.project_name}</p>
                  <p><strong>Type:</strong> {selectedRequest.form_data?.project_type}</p>
                  <p><strong>Budget:</strong> {selectedRequest.form_data?.budget_range}</p>
                  <p><strong>Timeline:</strong> {selectedRequest.form_data?.timeline_start || 'Not set'} → {selectedRequest.form_data?.timeline_end || 'Not set'}</p>
                  <p><strong>Description:</strong> {selectedRequest.form_data?.description}</p>
                </div>
              </div>

              {/* Business Info */}
              <div>
                <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">Business Information</h3>
                <div className="bg-brand-surface rounded-lg p-4 space-y-2">
                  <p><strong>Business Name:</strong> {selectedRequest.form_data?.business_name}</p>
                  <p><strong>Industry:</strong> {selectedRequest.form_data?.industry}</p>
                  <p><strong>Target Audience:</strong> {selectedRequest.form_data?.target_audience}</p>
                </div>
              </div>

              {/* Technical Requirements */}
              {selectedRequest.form_data?.platforms && selectedRequest.form_data.platforms.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">Technical Requirements</h3>
                  <div className="bg-brand-surface rounded-lg p-4">
                    <p><strong>Platforms:</strong> {selectedRequest.form_data.platforms.join(', ')}</p>
                    {selectedRequest.form_data?.technology_preferences && (
                      <p className="mt-2"><strong>Technology:</strong> {selectedRequest.form_data.technology_preferences}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleAccept(selectedRequest.id)}
                    disabled={actionLoading}
                    className="flex-1 pill-btn bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                  >
                    <IconCheck size={18} />
                    Accept & Create Workspace
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 pill-btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                  >
                    <IconX size={18} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <IconAlertCircle size={24} className="text-red-600" />
              </div>
              <h2 className="text-lg font-medium text-brand-dark">Reject Request</h2>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Are you sure you want to reject this project request? The client will be notified.
            </p>
            <div className="space-y-1 mb-4">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Reason (optional)</label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectMessage("");
                }}
                className="flex-1 pill-btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 pill-btn bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
