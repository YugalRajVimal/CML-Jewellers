"use client";

import { useEffect, useState } from "react";
import { Pencil, ShieldCheck, UserPlus, UserX } from "lucide-react";
import * as api from "@/lib/api";
import { AdminUser, Permission, Role } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Button, Select } from "@/components/ui";
import { Drawer, Field, TextInput, TextArea } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  { label: "Dashboard", perms: ["dashboard:read"] },
  { label: "Catalog", perms: ["product:read", "product:write", "category:write", "category:write", "inventory:read", "inventory:write"] },
  { label: "Fulfilment", perms: ["purchase:manage", "purchase:manage", "order:read", "order:write", "order:read", "order:read"] },
  { label: "Returns & refunds", perms: ["return:manage", "return:manage", "refund:manage", "refund:manage"] },
  { label: "Customers", perms: ["customer:read", "coupon:manage", "coupon:manage"] },
  { label: "Storefront", perms: ["content:manage", "content:manage"] },
  { label: "System", perms: ["admin_user:manage", "admin_user:manage", "role:manage", "role:manage", "dashboard:read"] },
];

function getUserId(u: any): string {
  return u._id || u.id;
}
function getRoleId(r: any): string {
  return r._id || r.id;
}
function getRoleName(r: any): string {
  if (!r) return "";
  return r.name || "";
}
function getRolePermissions(r: any): Permission[] {
  if (!r) return [];
  if (Array.isArray(r.permissions) && typeof r.permissions[0] === "string") {
    return r.permissions;
  }
  if (Array.isArray(r.permissions) && r.permissions[0]?.name) {
    return r.permissions.map((p: any) => p.name);
  }
  return [];
}
function getRoleDescription(r: any): string {
  if (!r) return "";
  return r.description || "";
}
function getRoleIsSystem(r: any): boolean {
  if (!r) return false;
  return !!r.isSystem;
}

function RolesInner() {
  const { can } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", roleId: "" });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; permissions: Permission[] }>({ name: "", description: "", permissions: [] });
  const [roleError, setRoleError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  async function load() {
    const [uRes, rRes] = await Promise.all([api.listAdminUsers(), api.listRoles()]);

    // Use .data only when it's not an array; otherwise, treat the response directly as an array.
    const admins = Array.isArray(uRes.data)
      ? uRes.data
      : Array.isArray((uRes.data as any)?.admins)
      ? (uRes.data as any).admins
      : [];
    const roleList = Array.isArray(rRes.data)
      ? rRes.data
      : Array.isArray((rRes.data as any)?.roles)
      ? (rRes.data as any).roles
      : [];

    console.log("Admin Users loaded:", uRes.data);
    console.log("Roles loaded:", rRes.data);

    setUsers(admins);
    setRoles(roleList);
  }

  useEffect(() => { load(); }, []);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.roleId) {
      setInviteError("Name, email and role are required.");
      return;
    }
    setInviting(true);
    try {
      await api.inviteAdminUser(inviteForm);
      setInviteOpen(false);
      setInviteForm({ name: "", email: "", roleId: "" });
      await load();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "Could not send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function toggleUserStatus(id: string) {
    await api.toggleAdminUserStatus(id);
    await load();
  }

  function openCreateRole() {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: ["dashboard:read"] });
    setRoleError(null);
    setRoleDrawerOpen(true);
  }

  function openEditRole(role: any) {
    setEditingRole(role);
    setRoleForm({ 
      name: getRoleName(role), 
      description: getRoleDescription(role), 
      permissions: [...getRolePermissions(role)] 
    });
    setRoleError(null);
    setRoleDrawerOpen(true);
  }

  function togglePermission(perm: Permission) {
    setRoleForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm],
    }));
  }

  async function submitRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleError(null);

    if (!editingRole && !roleForm.name.trim()) {
      setRoleError("Role name is required.");
      return;
    }
    setSavingRole(true);
    try {
      if (editingRole) {
        await api.updateRolePermissions(getRoleId(editingRole), roleForm.permissions);
      } else {
        await api.createRole(roleForm);
      }
      setRoleDrawerOpen(false);
      await load();
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : "Could not save role.");
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Admin users & roles"
        description="Manage who can access the console and what each role can do."
        actions={can("admin_user:manage") && <Button variant="primary" onClick={() => setInviteOpen(true)}><UserPlus size={15} /> Invite admin</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line"><p className="text-sm font-medium text-ink-900">Admin users</p></div>
          <div className="divide-y divide-line">
            {users.map((u) => {
              let userRoleObj = undefined;
              if (u.roleId && typeof u.roleId === "object" && u.roleId._id) {
                userRoleObj = roles.find((r) => getRoleId(r) === u.roleId._id);
              } else if (u.roleId && typeof u.roleId === "string") {
                userRoleObj = roles.find((r) => getRoleId(r) === u.roleId);
              }
              let statusText = typeof u.isActive === "boolean"
                ? (u.isActive ? "active" : "suspended")
                : (u.status || "active");
              return (
                <div key={getUserId(u)} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-ink-900">{u.name}</p>
                    <p className="text-xs text-ink-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-500">
                      {typeof u.roleId === "object" && u.roleId.name ? u.roleId.name : getRoleName(userRoleObj)}
                    </span>
                    <StatusPill status={statusText} />
                    {can("admin_user:manage") && (
                      <button
                        onClick={() => toggleUserStatus(getUserId(u))}
                        className="rounded-md p-1 hover:bg-ink-100"
                        aria-label={statusText === "active" ? "Suspend" : "Reactivate"}
                      >
                        <UserX size={14} className={statusText === "active" ? "text-ink-400" : "text-good"} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-ink-900 flex items-center gap-2"><ShieldCheck size={14} /> Roles</p>
            {can("role:manage") && <button onClick={openCreateRole} className="text-xs font-medium text-maroon-600 hover:underline">+ New role</button>}
          </div>
          <div className="space-y-4">
            {roles.map((r) => (
              <div key={getRoleId(r)} className="border-b border-line last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ink-900 text-sm">{getRoleName(r)}</p>
                    <p className="text-xs text-ink-500 mb-2">{getRoleDescription(r)}</p>
                  </div>
                  {can("role:manage") && !getRoleIsSystem(r) && (
                    <button onClick={() => openEditRole(r)} className="rounded-md p-1 hover:bg-ink-100 shrink-0" aria-label="Edit permissions">
                      <Pencil size={13} className="text-ink-500" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {getRolePermissions(r).slice(0, 4).map((p) => (
                    <span key={p} className="text-[10px] rounded bg-ink-100 px-1.5 py-0.5 text-ink-500 font-mono">{p}</span>
                  ))}
                  {getRolePermissions(r).length > 4 && <span className="text-[10px] text-ink-300">+{getRolePermissions(r).length - 4} more</span>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Drawer open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite admin" description="Sends an invite email with a set-password link (simulated here).">
        <form onSubmit={submitInvite}>
          <Field label="Full name"><TextInput value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} placeholder="e.g. Ananya Sharma" /></Field>
          <Field label="Email"><TextInput type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="name@cmljewellers.com" /></Field>
          <Field label="Role">
            <Select value={inviteForm.roleId} onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })} className="w-full">
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={getRoleId(r)} value={getRoleId(r)}>
                  {getRoleName(r)}
                </option>
              ))}
            </Select>
          </Field>
          {inviteError && <p className="text-sm text-bad mb-3">{inviteError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={inviting}>{inviting ? "Sending…" : "Send invite"}</Button>
          </div>
        </form>
      </Drawer>

      <Drawer
        open={roleDrawerOpen}
        onClose={() => setRoleDrawerOpen(false)}
        title={editingRole ? `Edit permissions — ${getRoleName(editingRole)}` : "New role"}
        description={editingRole ? undefined : "Pick exactly what this role can see and do across the console."}
      >
        <form onSubmit={submitRole}>
          {!editingRole && (
            <>
              <Field label="Role name"><TextInput value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Warehouse Staff" /></Field>
              <Field label="Description"><TextArea rows={2} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} placeholder="What is this role for?" /></Field>
            </>
          )}
          <p className="text-xs font-medium text-ink-700 mb-2">Permissions</p>
          <div className="space-y-3 mb-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="rounded-lg border border-line p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400 mb-2">{group.label}</p>
                <div className="space-y-1.5">
                  {group.perms.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-line accent-maroon-700"
                      />
                      <span className="font-mono text-xs">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {roleError && <p className="text-sm text-bad mb-3">{roleError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setRoleDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingRole}>{savingRole ? "Saving…" : editingRole ? "Save permissions" : "Create role"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function RolesPage() {
  return <PermissionGate perm="role:manage"><RolesInner /></PermissionGate>;
}
