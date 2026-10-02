"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getTeamMembers,
  updateMemberRole,
  inviteMember,
  removeMember,
  type InviteMemberResult,
} from "@/lib/api/users";
import type { TeamMember, Role } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { User, Shield, Users, Mail, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon: any }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex border-b border-neutral-200 mb-6 overflow-x-auto hide-scrollbar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
            active === t.id
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300",
          )}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const perms = usePermissions();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    ...(perms.canManageWorkspace
      ? [{ id: "team", label: "Team & Roles", icon: Users }]
      : []),
  ];

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Manage your personal preferences and workspace
        </p>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "profile" && <ProfileSettings />}
      {activeTab === "team" && perms.canManageWorkspace && <TeamSettings />}
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Profile updated");
    }, 800);
  };

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Profile Information
      </h2>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email Address"
          value={form.email}
          disabled
          hint="Contact support to change your email address"
        />
        <div className="pt-2">
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-neutral-100">
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">
          Your Role
        </h2>
        <div className="flex items-center gap-3 mt-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200 w-fit">
          <Shield className="h-5 w-5 text-neutral-500" />
          <div>
            <p className="text-sm font-bold text-neutral-900">{user?.role}</p>
            <p className="text-xs text-neutral-500">
              {user?.role === "ADMIN" &&
                "Full access to workspace and billing."}
              {user?.role === "ANALYST" &&
                "Can manage feedback and view analytics."}
              {user?.role === "VIEWER" && "Read-only access to analytics."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "ANALYST", label: "Analyst" },
  { value: "VIEWER", label: "Viewer" },
];

function TeamSettings() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ANALYST");
  const [inviting, setInviting] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<InviteMemberResult | null>(
    null,
  );

  const fetchMembers = async () => {
    try {
      setMembers(await getTeamMembers());
    } catch (err: any) {
      toast.error(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      await updateMemberRole({ memberId, role: newRole });
      setMembers((list) =>
        list.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
      );
      toast.success("Role updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const created = await inviteMember({
        email: inviteEmail,
        role: inviteRole as Role,
      });
      setInviteOpen(false);
      setInviteEmail("");
      setCredentials(created);
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    try {
      await removeMember(removeId);
      toast.success("Member removed");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Workspace Members
          </h2>
          <p className="text-sm text-neutral-500">
            Manage who has access to this workspace
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          Add Member
        </Button>
      </div>

      {loading && (
        <p className="p-5 text-sm text-neutral-500">Loading members…</p>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.id === user?.id;
              return (
                <tr key={member.id}>
                  <td>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {member.name}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-normal text-neutral-400">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </div>
                  </td>
                  <td>
                    <select
                      value={member.role}
                      disabled={isSelf}
                      title={
                        isSelf ? "You can't change your own role" : undefined
                      }
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value as Role)
                      }
                      className="text-xs border border-neutral-200 rounded p-1 disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-xs text-neutral-500">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveId(member.id)}
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add member */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Add Member"
        description="Creates an account in this workspace. No email is sent — you'll get a temporary password to share with them."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} loading={inviting}>
              Create Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
          />
          <Select
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={ROLE_OPTIONS}
          />
        </form>
      </Modal>

      {/* One-time credentials */}
      <Modal
        isOpen={!!credentials}
        onClose={() => setCredentials(null)}
        title="Member added"
        description="Share these login details securely. The password is shown only once."
        size="sm"
        footer={<Button onClick={() => setCredentials(null)}>Done</Button>}
      >
        {credentials && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Email</p>
              <p className="font-medium text-neutral-900">
                {credentials.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">
                Temporary password
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2 font-mono text-neutral-900">
                  {credentials.temporaryPassword}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      credentials.temporaryPassword,
                    );
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        description="Are you sure you want to remove this member? They will immediately lose access to the workspace."
        confirmLabel="Remove"
      />
    </div>
  );
}
