import { cn } from "@/lib/utils";

export function formatDate(dateStr: string, short = false): string {
  const date = new Date(dateStr);
  if (short) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

export function formatPct(num: number, sign = false): string {
  const formatted = Math.abs(num).toFixed(1) + "%";
  if (sign) return (num >= 0 ? "+" : "−") + formatted;
  return formatted;
}

export { cn };
