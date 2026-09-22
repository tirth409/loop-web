import type {
  Feedback,
  FeedbackFilters,
  PaginatedResponse,
  AddFeedbackPayload,
  CsvUploadResult,
  FeedbackStatus,
} from "@/lib/types";
import { mockFeedbackList } from "@/lib/mock/data";

export async function getFeedback(
  filters: FeedbackFilters = {}
): Promise<PaginatedResponse<Feedback>> {
  await new Promise((r) => setTimeout(r, 400));

  let data = [...mockFeedbackList];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (f) =>
        f.content.toLowerCase().includes(q) ||
        f.customerLabel.toLowerCase().includes(q)
    );
  }
  if (filters.channel) data = data.filter((f) => f.channel === filters.channel);
  if (filters.sentiment) data = data.filter((f) => f.sentiment === filters.sentiment);
  if (filters.status) data = data.filter((f) => f.status === filters.status);
  if (filters.theme) data = data.filter((f) => f.themes.includes(filters.theme!));

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const total = data.length;
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);

  return {
    data: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function addFeedback(payload: AddFeedbackPayload): Promise<Feedback> {
  await new Promise((r) => setTimeout(r, 600));
  const newFeedback: Feedback = {
    id: `fb-${Date.now()}`,
    content: payload.content,
    channel: payload.channel,
    customerLabel: payload.customerLabel,
    sourceRef: payload.sourceRef,
    sentiment: "NEUTRAL",
    themes: [],
    status: "NEW",
    createdAt: new Date().toISOString(),
    workspaceId: "ws-1",
  };
  mockFeedbackList.unshift(newFeedback);
  return newFeedback;
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<Feedback> {
  await new Promise((r) => setTimeout(r, 300));
  const item = mockFeedbackList.find((f) => f.id === id);
  if (!item) throw new Error("Feedback not found");
  item.status = status;
  return item;
}

export async function uploadCsv(_file: File): Promise<CsvUploadResult> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    imported: Math.floor(Math.random() * 50 + 20),
    failed: Math.floor(Math.random() * 5),
    errors: [
      { row: 3, reason: "Missing 'channel' field" },
      { row: 7, reason: "Content is empty" },
    ],
  };
}

export async function ingestChannel(channel: string): Promise<{ imported: number }> {
  await new Promise((r) => setTimeout(r, 1500));
  return { imported: Math.floor(Math.random() * 30 + 5) };
}
