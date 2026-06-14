"use client";

import React, { useState, useMemo } from "react";
import { 
  IconSearch, 
  IconFilter, 
  IconUserOff, 
  IconUserCheck,
  IconTrash, 
  IconDotsVertical 
} from "@tabler/icons-react";
import { toggleUserStatus, deleteUser } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const { showToast } = useToast();

  const usersPerPage = 15;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    try {
      await toggleUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_disabled: !currentStatus } : u));
      showToast(`User ${!currentStatus ? 'disabled' : 'enabled'} successfully`, 'success');
    } catch (error: any) {
      showToast(`Failed to update user: ${error.message}`, 'error');
    } finally {
      setLoadingId(null);
      setActionMenuOpen(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    setLoadingId(userId);
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      showToast('User deleted successfully', 'success');
    } catch (error: any) {
      showToast(`Failed to delete user: ${error.message}`, 'error');
    } finally {
      setLoadingId(null);
      setActionMenuOpen(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-brand-light rounded-lg pl-9 pr-4 py-2 text-[13px] outline-none focus:border-brand-accent transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-brand-light rounded-lg pl-9 pr-8 py-2 text-[13px] outline-none focus:border-brand-accent transition-colors appearance-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card bg-white overflow-visible p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-brand-light text-text-secondary bg-brand-surface/50">
                <th className="text-left p-4 font-medium rounded-tl-xl whitespace-nowrap">User</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Email</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Role</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Status</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Joined</th>
                <th className="text-right p-4 font-medium rounded-tr-xl whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-brand-light/50 last:border-0 hover:bg-brand-surface/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-medium shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            u.full_name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <span className="font-medium text-brand-dark whitespace-nowrap">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary whitespace-nowrap">{u.email || "—"}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-purple' :
                        u.role === 'freelancer' ? 'badge-success' :
                        'badge-info'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`badge ${u.is_disabled ? 'badge-danger' : 'badge-success'}`}>
                        {u.is_disabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-text-tertiary whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActionMenuOpen(actionMenuOpen === u.id ? null : u.id)}
                          className="p-1.5 text-text-tertiary hover:bg-brand-surface rounded-md transition-colors"
                          disabled={loadingId === u.id}
                        >
                          <IconDotsVertical size={16} />
                        </button>
                        {actionMenuOpen === u.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-brand-light rounded-xl shadow-lg z-50 py-1">
                              <button
                                onClick={() => handleToggleStatus(u.id, u.is_disabled)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-brand-surface transition-colors text-left"
                              >
                                {u.is_disabled ? (
                                  <><IconUserCheck size={14} className="text-status-success"/> Enable User</>
                                ) : (
                                  <><IconUserOff size={14} className="text-status-warning"/> Disable User</>
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-status-danger hover:bg-brand-surface transition-colors text-left"
                              >
                                <IconTrash size={14} />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-brand-light flex items-center justify-between">
            <p className="text-[12px] text-text-secondary">
              Showing <span className="font-medium text-brand-dark">{(currentPage - 1) * usersPerPage + 1}</span> to <span className="font-medium text-brand-dark">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of <span className="font-medium text-brand-dark">{filteredUsers.length}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-brand-light text-[12px] font-medium text-brand-dark hover:bg-brand-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-brand-light text-[12px] font-medium text-brand-dark hover:bg-brand-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
