// ─── Auth ──────────────────────────────────────────────────────────────────
export type Role = "ADMIN" | "ANALYST" | "VIEWER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  workspaceId: string;
  workspaceName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
}

// ─── Feedback ──────────────────────────────────────────────────────────────
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
export type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";
export type Channel =
  | "SUPPORT_TICKET"
  | "APP_STORE"
  | "NPS_SURVEY"
  | "SALES_CALL"
  | "COMMUNITY"
  | "OTHER";

export interface Feedback {
  id: string;
  content: string;
  channel: Channel;
  customerLabel: string;
  sourceRef?: string;
  sentiment: Sentiment;
  themes: string[];
  status: FeedbackStatus;
  createdAt: string;
  workspaceId: string;
}

export interface FeedbackFilters {
  search?: string;
  channel?: Channel | "";
  sentiment?: Sentiment | "";
  theme?: string;
  status?: FeedbackStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AddFeedbackPayload {
  content: string;
  channel: Channel;
  customerLabel: string;
  sourceRef?: string;
}

export interface CsvUploadResult {
  imported: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalFeedback: number;
  negativePct: number;
  newThisWeek: number;
  activeThemes: number;
  totalFeedbackTrend: number;
  negativePctTrend: number;
  newThisWeekTrend: number;
  activeThemesTrend: number;
}

export interface VolumeDataPoint {
  date: string;
  count: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ThemeBar {
  theme: string;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  volumeChart: VolumeDataPoint[];
  sentimentBreakdown: SentimentBreakdown;
  topThemes: ThemeBar[];
  recentFeedback: Feedback[];
}

// ─── Themes ────────────────────────────────────────────────────────────────
export interface Theme {
  id: string;
  name: string;
  description: string;
  feedbackCount: number;
  growthPct: number;
  sentiment: SentimentBreakdown;
  isSpike: boolean;
  volumeOverTime: VolumeDataPoint[];
}

// ─── Insights / Ask LOOP ───────────────────────────────────────────────────
export interface InsightMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  groundedIn?: number;
  sources?: Feedback[];
  createdAt: string;
}

export interface AskLoopPayload {
  question: string;
  conversationId?: string;
}

export interface AskLoopResponse {
  answer: string;
  groundedIn: number;
  sources: Feedback[];
  conversationId: string;
}

// ─── Reports ───────────────────────────────────────────────────────────────
export interface Report {
  id: string;
  title: string;
  period: string;
  createdAt: string;
  generatedBy: string;
  status: "READY" | "GENERATING" | "FAILED";
  summary?: string;
  topThemes?: ThemeBar[];
  quotes?: string[];
  recommendations?: string[];
  sentimentShift?: SentimentBreakdown;
}

export interface GenerateReportPayload {
  dateFrom: string;
  dateTo: string;
}

// ─── Users / Team ──────────────────────────────────────────────────────────
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  avatarUrl?: string;
}

export interface InviteMemberPayload {
  email: string;
  role: Role;
}

export interface UpdateMemberRolePayload {
  memberId: string;
  role: Role;
}

// ─── API Errors ────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
