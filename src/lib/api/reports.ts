import type { Report, GenerateReportPayload } from "@/lib/types";
import { mockReports } from "@/lib/mock/data";

export async function getReports(): Promise<Report[]> {
  await new Promise((r) => setTimeout(r, 500));
  return mockReports;
}

export async function getReportById(id: string): Promise<Report> {
  await new Promise((r) => setTimeout(r, 300));
  const report = mockReports.find((r) => r.id === id);
  if (!report) throw new Error("Report not found");
  return report;
}

export async function generateReport(
  payload: GenerateReportPayload
): Promise<Report> {
  await new Promise((r) => setTimeout(r, 3000));
  const newReport: Report = {
    id: `rpt-${Date.now()}`,
    title: `Voice of Customer — Custom Report`,
    period: `${payload.dateFrom} – ${payload.dateTo}`,
    createdAt: new Date().toISOString(),
    generatedBy: "Alex Johnson",
    status: "READY",
    summary:
      "Custom report generated based on selected date range. Analysis shows consistent themes across the period with notable spikes in performance-related feedback.",
    topThemes: [
      { theme: "Performance Issues", count: 156 },
      { theme: "Onboarding Friction", count: 134 },
    ],
    quotes: ["Loading times have doubled since the v3 update."],
    recommendations: ["Fix v3 performance regression as top priority."],
    sentimentShift: { positive: 48, neutral: 32, negative: 20 },
  };
  mockReports.unshift(newReport);
  return newReport;
}
