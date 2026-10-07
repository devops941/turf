"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldBan, ShieldCheck, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Inner />
    </RequireRole>
  );
}

function Inner() {
  const { show } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter === "ALL" ? "" : `?role=${filter}`;
      const data = await api.get<{ items: User[] }>(`/api/admin/users${q}`);
      setUsers(data.items);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (u: User) => {
    const next = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    try {
      await api.patch(`/api/admin/users/${u.id}/status`, { status: next });
      show(`${u.name} is now ${next}.`, "success");
      load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "Could not update", "error");
    }
  };

  return (
    <DashboardShell kind="admin" title="Users" subtitle="Players, venue owners and administrators.">
      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "USER", "VENUE_OWNER", "ADMIN"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`badge border px-3 py-1.5 ${
              filter === f
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner label="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No users in this view" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="table-head">Name</th>
                  <th className="table-head">Email</th>
                  <th className="table-head">Phone</th>
                  <th className="table-head">Role</th>
                  <th className="table-head">Joined</th>
                  <th className="table-head">Status</th>
                  <th className="table-head"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="table-cell font-semibold text-slate-800">{u.name}</td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell text-slate-500">{u.phone ?? "-"}</td>
                    <td className="table-cell">
                      <Badge status={u.role} />
                    </td>
                    <td className="table-cell text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="table-cell">
                      <Badge status={u.status} />
                    </td>
                    <td className="table-cell text-right">
                      {u.role !== "ADMIN" && (
                        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => toggle(u)}>
                          {u.status === "SUSPENDED" ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" /> Activate
                            </>
                          ) : (
                            <>
                              <ShieldBan className="h-3.5 w-3.5" /> Suspend
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
