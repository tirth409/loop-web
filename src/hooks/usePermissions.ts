"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getPermissions, type Permissions } from "@/lib/permissions";

export function usePermissions(): Permissions {
  const { user } = useAuth();
  if (!user) {
    return {
      canManageWorkspace: false,
      canManageFeedback: false,
      canViewAnalytics: false,
      canGenerateReports: false,
      canInviteMembers: false,
      canChangeRoles: false,
      canExportData: false,
    };
  }
  return getPermissions(user.role);
}
