import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "positive"
  | "negative";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-50 text-brand-700 border border-brand-200",
  success: "bg-success-50 text-success-700 border border-success-100",
  warning: "bg-warning-50 text-warning-600 border border-warning-100",
  danger: "bg-danger-50 text-danger-700 border border-danger-100",
  info: "bg-blue-50 text-blue-700 border border-blue-100",
  neutral: "bg-neutral-100 text-neutral-600 border border-neutral-200",
  positive: "bg-success-50 text-success-700 border border-success-100",
  negative: "bg-danger-50 text-danger-700 border border-danger-100",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-blue-500",
  neutral: "bg-neutral-400",
  positive: "bg-success-500",
  negative: "bg-danger-500",
};

export function Badge({ variant = "default", children, className, dot }: BadgeProps) {
  return (
    <span className={cn("badge", variantClasses[variant], className)}>
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[variant])} />
      )}
      {children}
    </span>
  );
}

// Sentiment-specific badge helper
export function SentimentBadge({ sentiment }: { sentiment: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    POSITIVE: "positive",
    NEUTRAL: "neutral",
    NEGATIVE: "negative",
  };
  const labelMap: Record<string, string> = {
    POSITIVE: "Positive",
    NEUTRAL: "Neutral",
    NEGATIVE: "Negative",
  };
  return (
    <Badge variant={variantMap[sentiment] ?? "neutral"} dot>
      {labelMap[sentiment] ?? sentiment}
    </Badge>
  );
}

// Status badge helper
export function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, BadgeVariant> = {
    NEW: "info",
    REVIEWED: "warning",
    ACTIONED: "success",
  };
  const labelMap: Record<string, string> = {
    NEW: "New",
    REVIEWED: "Reviewed",
    ACTIONED: "Actioned",
  };
  return (
    <Badge variant={variantMap[status] ?? "neutral"} dot>
      {labelMap[status] ?? status}
    </Badge>
  );
}
