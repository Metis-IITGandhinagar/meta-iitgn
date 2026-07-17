"use client";

import React, { useEffect, useState } from "react";
import GenericOverlayModal from "@/components/GenericOverlayModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { Shield, FileText, Settings, Users, ArrowUpRight } from "lucide-react";
import PendingChangesView from "../../wiki/PendingChangesView";
import BlogPendingChangesView from "../../blog/BlogPendingChangesView";

interface AdminDashboardOverlayProps {
  setShowDashboard: (show: boolean) => void;
}

interface AuditLogRecord {
  log_id: number;
  actor_id: number;
  action: string;
  table_name: string;
  record_id: number;
  ip_address: string | null;
  created_at: string;
  actor: {
    user_id: number;
    name: string;
    avatar_url: string | null;
    role: string;
  };
}

interface UserRecord {
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export default function AdminDashboardOverlay({ setShowDashboard }: AdminDashboardOverlayProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "approvals">("logs");
  const [showWikiApprovals, setShowWikiApprovals] = useState(false);
  const [showBlogApprovals, setShowBlogApprovals] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsLoadingMore, setLogsLoadingMore] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsHasMore, setLogsHasMore] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersLoadingMore, setUsersLoadingMore] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Role Update State
  const [updatingRole, setUpdatingRole] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
    oldRole: string;
    newRole: string;
  }>({
    isOpen: false,
    userId: null,
    userName: "",
    oldRole: "",
    newRole: "",
  });

  const limit = 10;

  const fetchLogs = async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLogsLoading(true);
    } else {
      setLogsLoadingMore(true);
    }
    setLogsError(null);
    try {
      const res = await apiService.getAuditLogs({ page: pageNum, limit });
      if (res && res.success) {
        if (append) {
          setLogs((prev) => [...prev, ...res.logs]);
        } else {
          setLogs(res.logs);
        }
        setLogsHasMore(res.hasMore);
      }
    } catch (err: any) {
      console.error(err);
      setLogsError(err.response?.data?.error || err.message || "Failed to load audit logs.");
    } finally {
      setLogsLoading(false);
      setLogsLoadingMore(false);
    }
  };

  const fetchUsersData = async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setUsersLoading(true);
    } else {
      setUsersLoadingMore(true);
    }
    setUsersError(null);
    try {
      const res = await apiService.getUsers({ page: pageNum, limit });
      if (res && res.success) {
        if (append) {
          setUsers((prev) => [...prev, ...res.users]);
        } else {
          setUsers(res.users);
        }
        setUsersHasMore(res.hasMore);
      }
    } catch (err: any) {
      console.error(err);
      setUsersError(err.response?.data?.error || err.message || "Failed to load users list.");
    } finally {
      setUsersLoading(false);
      setUsersLoadingMore(false);
    }
  };

  const fetchTotalUsersCount = async () => {
    try {
      const res = await apiService.getUsersCount();
      if (res && res.success) {
        setUsersCount(res.count);
      }
    } catch (err) {
      console.error("Failed to load user count:", err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchLogs(1, false);
      fetchUsersData(1, false);
      fetchTotalUsersCount();
    }
  }, [currentUser]);

  const loadMoreLogs = () => {
    const next = logsPage + 1;
    setLogsPage(next);
    fetchLogs(next, true);
  };

  const loadMoreUsers = () => {
    const next = usersPage + 1;
    setUsersPage(next);
    fetchUsersData(next, true);
  };

  const triggerRoleChange = (userId: number, userName: string, oldRole: string, newRole: string) => {
    if (userId === currentUser?.user_id) {
      alert("You cannot change your own admin role.");
      return;
    }
    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      oldRole,
      newRole,
    });
  };

  const executeRoleChange = async () => {
    const { userId, userName, newRole } = confirmModal;
    if (userId === null) return;
    try {
      setUpdatingRole(true);
      await apiService.updateUserRole(userId, newRole as any);
      alert(`Successfully updated ${userName}'s role to ${newRole}.`);

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      );
      // Reload audit logs to show this update immediately
      setLogsPage(1);
      fetchLogs(1, false);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || "Failed to change user role.");
    } finally {
      setUpdatingRole(false);
      setConfirmModal({ isOpen: false, userId: null, userName: "", oldRole: "", newRole: "" });
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-primary/10 text-primary border border-primary/25";
      case "moderator":
        return "bg-warning/10 text-warning border border-warning/25";
      default:
        return "bg-neutral/15 text-base-content/80 border border-base-300";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown time";
    }
  };

  return (
    <GenericOverlayModal
      isOpen={true}
      onClose={() => setShowDashboard(false)}
      title="Admin Management Panel"
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-6 w-full font-sans select-text pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-300 pb-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-serif font-black text-base-content tracking-tight">Admin Dashboard</h2>
            <p className="text-xs text-base-content/50 font-semibold uppercase tracking-wider">
              Monitor audit logs and configure roles
            </p>
          </div>

          {/* Tabs switch */}
          <div className="flex items-center gap-1 bg-base-200 p-1.5 rounded-2xl self-start sm:self-auto shadow-inner">
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === "logs"
                  ? "bg-base-100 text-base-content shadow"
                  : "text-base-content/65 hover:bg-base-300/50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Audit Logs</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === "users"
                  ? "bg-base-100 text-base-content shadow"
                  : "text-base-content/65 hover:bg-base-300/50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>User Roles</span>
            </button>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === "approvals"
                  ? "bg-base-100 text-base-content shadow"
                  : "text-base-content/65 hover:bg-base-300/50"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Pending Approvals</span>
            </button>
          </div>
        </div>

        {/* Tab content: Logs */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {logsLoading ? (
              <div className="space-y-3 pt-2">
                <div className="h-16 w-full bg-base-200 animate-pulse rounded-2xl"></div>
                <div className="h-16 w-full bg-base-200 animate-pulse rounded-2xl"></div>
                <div className="h-16 w-full bg-base-200 animate-pulse rounded-2xl"></div>
              </div>
            ) : logsError ? (
              <div className="p-6 border border-error/20 bg-error/10 text-error rounded-2xl text-center">
                <p className="font-semibold">{logsError}</p>
                <button
                  onClick={() => { setLogsPage(1); fetchLogs(1, false); }}
                  className="btn btn-sm btn-error mt-4 text-error-content rounded-xl"
                >
                  Retry
                </button>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
                <p className="text-base-content/60 font-medium">No audit log records found.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {logs.map((log) => {
                  const actorName = log.actor?.name || `User #${log.actor_id}`;
                  const initials = actorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
                  return (
                    <div key={log.log_id} className="p-4 border border-base-300 bg-base-100 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow transition-shadow">
                      <div className="w-9 h-9 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-xs text-base-content/85 shrink-0 select-none">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-base-content">{actorName}</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${getRoleBadgeStyle(log.actor?.role || "normal")}`}>
                              {log.actor?.role || "normal"}
                            </span>
                          </div>
                          <span className="text-[10px] text-base-content/40 font-semibold">{formatDate(log.created_at)}</span>
                        </div>
                        <p className="text-sm text-base-content/75 mt-1 font-medium leading-relaxed">
                          {log.action}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-base-content/50 font-bold uppercase tracking-wider">
                          <span>Target: <span className="text-base-content/70">{log.table_name} #{log.record_id}</span></span>
                          {log.ip_address && (
                            <span>IP: <span className="text-base-content/70">{log.ip_address}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {logsHasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={loadMoreLogs}
                      disabled={logsLoadingMore}
                      className="btn btn-sm btn-outline rounded-xl font-bold"
                    >
                      {logsLoadingMore ? "Loading..." : "Load More Logs"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab content: User Management */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Total users count label */}
            {usersCount !== null && (
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase text-primary tracking-wider">Total Active Users</h4>
                    <p className="text-2xl font-serif font-black text-base-content mt-0.5">{usersCount}</p>
                  </div>
                </div>
              </div>
            )}

            {usersLoading ? (
              <div className="space-y-3 pt-2">
                <div className="h-16 w-full bg-base-200 animate-pulse rounded-2xl"></div>
                <div className="h-16 w-full bg-base-200 animate-pulse rounded-2xl"></div>
              </div>
            ) : usersError ? (
              <div className="p-6 border border-error/20 bg-error/10 text-error rounded-2xl text-center">
                <p className="font-semibold">{usersError}</p>
                <button
                  onClick={() => { setUsersPage(1); fetchUsersData(1, false); }}
                  className="btn btn-sm btn-error mt-4 text-error-content rounded-xl"
                >
                  Retry
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-base-300 bg-base-100 rounded-2xl">
                <p className="text-base-content/60 font-medium">No users found.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {users.map((item) => {
                  const initials = item.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";
                  return (
                    <div key={item.user_id} className="p-4 border border-base-300 bg-base-100 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow transition-shadow">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 flex items-center justify-center font-bold text-sm text-base-content/85 shrink-0 select-none">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-base-content truncate">{item.name}</h4>
                          <p className="text-xs text-base-content/50 mt-0.5 truncate font-medium">{item.email}</p>
                          <span className="text-[10px] text-base-content/40 font-semibold">Joined: {new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${getRoleBadgeStyle(item.role)}`}>
                          {item.role}
                        </span>

                        <select
                          value={item.role}
                          onChange={(e) => triggerRoleChange(item.user_id, item.name, item.role, e.target.value)}
                          className="select select-sm select-bordered rounded-xl text-xs font-semibold focus:outline-none focus:border-primary pr-8"
                          disabled={item.user_id === currentUser?.user_id}
                        >
                          <option value="normal">Normal</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {usersHasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={loadMoreUsers}
                      disabled={usersLoadingMore}
                      className="btn btn-sm btn-outline rounded-xl font-bold"
                    >
                      {usersLoadingMore ? "Loading..." : "Load More Users"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab content: Pending Approvals */}
        {activeTab === "approvals" && (
          <div className="space-y-6 py-4">
            <div className="bg-base-200/50 border border-base-300 rounded-3xl p-6 text-center max-w-xl mx-auto space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto opacity-75" />
              <div>
                <h3 className="text-lg font-black text-base-content">Manage Pending Approvals</h3>
                <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
                  Review and publish proposed wiki articles, page edits, and blog posts submitted by campus contributors.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowWikiApprovals(true)}
                  className="btn btn-primary rounded-xl font-bold flex-1 sm:flex-initial cursor-pointer animate-none"
                >
                  Review Wiki Articles
                </button>
                <button
                  onClick={() => setShowBlogApprovals(true)}
                  className="btn btn-secondary rounded-xl font-bold flex-1 sm:flex-initial cursor-pointer animate-none"
                >
                  Review Blog Posts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showWikiApprovals && (
        <PendingChangesView
          setShowPendingChanges={setShowWikiApprovals}
          isGlobal={true}
        />
      )}

      {showBlogApprovals && (
        <BlogPendingChangesView
          setShowPendingChanges={setShowBlogApprovals}
          isGlobal={true}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, userId: null, userName: "", oldRole: "", newRole: "" })}
        onConfirm={executeRoleChange}
        title="Update User Role"
        message={`Are you sure you want to update ${confirmModal.userName}'s role from "${confirmModal.oldRole}" to "${confirmModal.newRole}"? This grants them new system privileges.`}
        confirmText="Update Role"
        cancelText="Cancel"
        type="warning"
      />
    </GenericOverlayModal>
  );
}
