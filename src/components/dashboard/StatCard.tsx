"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPct } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/Skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number | null;
  comparison?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  loading?: boolean;
  invertTrend?: boolean;
}

export function StatCard({
  title,
  value,
  trend,
  comparison,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50",
  loading,
  invertTrend,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="card p-6 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  const isUp = trend !== undefined && trend !== null && trend >= 0;
  const isGood = trend !== undefined && trend !== null && (invertTrend ? trend <= 0 : trend >= 0);

  return (
    <div className="card p-6 hover:shadow-card-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-neutral-500">{title}</p>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4.5 w-4.5 h-[18px] w-[18px]", iconColor)} />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-neutral-900 tracking-tight">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        {trend !== undefined && trend !== null && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold pb-1",
              isGood ? "text-success-600" : "text-danger-600"
            )}
          >
            {isUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {formatPct(Math.abs(trend))}
          </div>
        )}
      </div>
      {comparison && (
        <p className="text-xs text-neutral-400 mt-1">{comparison}</p>
      )}
    </div>
  );
}
