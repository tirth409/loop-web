import type { Role } from "@/lib/types";

export interface Permissions {
  canManageWorkspace: boolean;
  canManageFeedback: boolean;
  canViewAnalytics: boolean;
  canGenerateReports: boolean;
  canInviteMembers: boolean;
  canChangeRoles: boolean;
  canExportData: boolean;
}

const PERMISSIONS: Record<Role, Permissions> = {
  ADMIN: {
    canManageWorkspace: true,
    canManageFeedback: true,
    canViewAnalytics: true,
    canGenerateReports: true,
    canInviteMembers: true,
    canChangeRoles: true,
    canExportData: true,
  },
  ANALYST: {
    canManageWorkspace: false,
    canManageFeedback: true,
    canViewAnalytics: true,
    canGenerateReports: true,
    canInviteMembers: false,
    canChangeRoles: false,
    canExportData: true,
  },
  VIEWER: {
    canManageWorkspace: false,
    canManageFeedback: false,
    canViewAnalytics: true,
    canGenerateReports: false,
    canInviteMembers: false,
    canChangeRoles: false,
    canExportData: false,
  },
};

export function getPermissions(role: Role): Permissions {
  return PERMISSIONS[role];
}

export function hasPermission(role: Role, key: keyof Permissions): boolean {
  return PERMISSIONS[role][key];
}
