import type {
  Feedback,
  FeedbackFilters,
  PaginatedResponse,
  AddFeedbackPayload,
  CsvUploadResult,
  FeedbackStatus,
} from "@/lib/types";
import { apiClient } from "@/lib/api/client";

export async function getFeedback(
  filters: FeedbackFilters = {}
): Promise<PaginatedResponse<Feedback>> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiClient.get<PaginatedResponse<Feedback>>(`/feedback?${params.toString()}`);
}

export async function addFeedback(payload: AddFeedbackPayload): Promise<Feedback> {
  return apiClient.post<Feedback>("/feedback", payload);
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<Feedback> {
  return apiClient.patch<Feedback>(`/feedback/${id}/status`, { status });
}

export async function uploadCsv(file: File): Promise<CsvUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/feedback/csv-upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to upload CSV");
  }
  return res.json();
}

export async function ingestChannel(channel: string): Promise<{ imported: number }> {
  return apiClient.post<{ imported: number }>("/feedback/ingest-channel", { channel });
}
export async function reclassifyFeedback(id: string): Promise<Feedback> {
  return apiClient.post<Feedback>(`/feedback/${id}/reclassify`, {});
}