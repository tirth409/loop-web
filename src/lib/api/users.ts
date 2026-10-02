import type {
  TeamMember,
  InviteMemberPayload,
  UpdateMemberRolePayload,
} from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export type InviteMemberResult = TeamMember & { temporaryPassword: string };

export async function getTeamMembers(): Promise<TeamMember[]> {
  return apiClient.get<TeamMember[]>("/users");
}

export async function inviteMember(
  payload: InviteMemberPayload
): Promise<InviteMemberResult> {
  return apiClient.post<InviteMemberResult>("/users", payload);
}

export async function updateMemberRole(
  payload: UpdateMemberRolePayload
): Promise<TeamMember> {
  return apiClient.patch<TeamMember>(`/users/${payload.memberId}`, {
    role: payload.role,
  });
}

export async function removeMember(memberId: string): Promise<void> {
  return apiClient.delete<void>(`/users/${memberId}`);
}