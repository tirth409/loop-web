import type {
  TeamMember,
  InviteMemberPayload,
  UpdateMemberRolePayload,
  User,
} from "@/lib/types";
import { mockTeamMembers } from "@/lib/mock/data";

export async function getTeamMembers(): Promise<TeamMember[]> {
  await new Promise((r) => setTimeout(r, 400));
  return mockTeamMembers;
}

export async function inviteMember(
  payload: InviteMemberPayload
): Promise<TeamMember> {
  await new Promise((r) => setTimeout(r, 700));
  const newMember: TeamMember = {
    id: `usr-${Date.now()}`,
    name: payload.email.split("@")[0],
    email: payload.email,
    role: payload.role,
    joinedAt: new Date().toISOString(),
  };
  mockTeamMembers.push(newMember);
  return newMember;
}

export async function updateMemberRole(
  payload: UpdateMemberRolePayload
): Promise<TeamMember> {
  await new Promise((r) => setTimeout(r, 400));
  const member = mockTeamMembers.find((m) => m.id === payload.memberId);
  if (!member) throw new Error("Member not found");
  member.role = payload.role;
  return member;
}

export async function removeMember(memberId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
  const idx = mockTeamMembers.findIndex((m) => m.id === memberId);
  if (idx > -1) mockTeamMembers.splice(idx, 1);
}

export async function updateProfile(
  userId: string,
  data: Partial<User>
): Promise<User> {
  await new Promise((r) => setTimeout(r, 500));
  return { id: userId, ...data } as User;
}
