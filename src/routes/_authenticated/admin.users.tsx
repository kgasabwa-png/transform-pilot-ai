import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listUsers, setUserRole } from "@/lib/admin/admin.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [search, setSearch] = useState("");
  const fetchUsers = useServerFn(listUsers);
  const updateRole = useServerFn(setUserRole);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => fetchUsers({ data: { search: search || undefined } }),
  });

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      await updateRole({ data: { userId, role: "admin", grant: !isAdmin } });
      toast.success(isAdmin ? "Admin revoked" : "Admin granted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search, inspect activity, grant admin.</p>
      </header>

      <Input
        placeholder="Search by email or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 font-medium">Last seen</th>
                <th className="px-4 py-2.5 font-medium">Promises</th>
                <th className="px-4 py-2.5 font-medium">Roles</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : (data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users.
                  </td>
                </tr>
              ) : (
                (data ?? []).map((u: any) => {
                  const isAdmin = u.roles.includes("admin");
                  return (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{u.full_name || "—"}</div>
                        <div className="text-[12px] text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {u.last_seen ? new Date(u.last_seen).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{u.promises}</td>
                      <td className="px-4 py-2.5">
                        {u.roles.length ? (
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r: string) => (
                              <span
                                key={r}
                                className="rounded bg-foreground/10 px-1.5 py-0.5 text-[11px]"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">user</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant={isAdmin ? "outline" : "default"}
                          onClick={() => toggleAdmin(u.id, isAdmin)}
                        >
                          {isAdmin ? "Revoke admin" : "Make admin"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
