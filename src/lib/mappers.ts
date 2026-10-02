import type {
  Feedback as PrismaFeedback,
  FeedbackTheme,
  Theme as PrismaTheme,
  Report as PrismaReport,
  User as PrismaUser,
} from "@prisma/client";

type FeedbackWithThemes = PrismaFeedback & {
  themes: (FeedbackTheme & { theme: PrismaTheme })[];
};

export function toFeedbackDTO(fb: FeedbackWithThemes) {
  return {
    id: fb.id,
    content: fb.content,
    channel: fb.channel,
    customerLabel: fb.customerLabel ?? "",
    sourceRef: fb.sourceRef ?? undefined,
    sentiment: fb.sentiment ?? "NEUTRAL",
    themes: fb.themes.map((ft) => ft.theme.name),
    status: fb.status,
    createdAt: fb.createdAt.toISOString(),
    workspaceId: fb.workspaceId,
  };
}
const fmtDay = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export function toReportDTO(
  report: PrismaReport & { generatedBy: Pick<PrismaUser, "name"> | null }
) {
  const c = (report.contentJson ?? {}) as {
    summary?: string;
    topThemes?: { theme: string; count: number }[];
    quotes?: string[];
    recommendations?: string[];
    sentimentShift?: { positive: number; neutral: number; negative: number };
  };

  return {
    id: report.id,
    title: report.title,
    period: `${fmtDay(report.periodStart)} – ${fmtDay(report.periodEnd)}`,
    createdAt: report.createdAt.toISOString(),
    generatedBy: report.generatedBy?.name ?? "Former member",
    status: "READY" as const,
    summary: c.summary,
    topThemes: c.topThemes ?? [],
    quotes: c.quotes ?? [],
    recommendations: c.recommendations ?? [],
    sentimentShift: c.sentimentShift,
  };
}
export function toTeamMemberDTO(
  u: Pick<PrismaUser, "id" | "name" | "email" | "role" | "createdAt">
) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    joinedAt: u.createdAt.toISOString(),
  };
}