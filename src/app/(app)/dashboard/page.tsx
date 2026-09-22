"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  AlertTriangle,
  Calendar,
  RefreshCw,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  VolumeChart,
  SentimentChart,
  TopThemesChart,
} from "@/components/dashboard/Charts";
import { Badge, SentimentBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboardData();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {user?.workspaceName} · {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            loading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Link href="/inbox">
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Add Feedback
            </Button>
          </Link>
        </div>
      </div>

      {error && !loading && (
        <ErrorState
          description={error}
          onRetry={fetchData}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Feedback"
          value={data?.stats.totalFeedback ?? 0}
          trend={data?.stats.totalFeedbackTrend}
          comparison="vs. last 30 days"
          icon={MessageSquare}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          loading={loading}
        />
        <StatCard
          title="Negative Feedback %"
          value={data ? `${data.stats.negativePct}%` : "—"}
          trend={data?.stats.negativePctTrend}
          comparison="lower is better"
          icon={AlertTriangle}
          iconColor="text-danger-500"
          iconBg="bg-danger-50"
          loading={loading}
        />
        <StatCard
          title="New This Week"
          value={data?.stats.newThisWeek ?? 0}
          trend={data?.stats.newThisWeekTrend}
          comparison="vs. last week"
          icon={Calendar}
          iconColor="text-accent-600"
          iconBg="bg-accent-50"
          loading={loading}
        />
        <StatCard
          title="Active Themes"
          value={data?.stats.activeThemes ?? 0}
          trend={data?.stats.activeThemesTrend}
          comparison="themes detected"
          icon={TrendingUp}
          iconColor="text-warning-600"
          iconBg="bg-warning-50"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <VolumeChart data={data?.volumeChart ?? []} loading={loading} />
        </div>
        <div>
          <SentimentChart
            data={data?.sentimentBreakdown ?? { positive: 0, neutral: 0, negative: 0 }}
            loading={loading}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top Themes Chart */}
        <div className="lg:col-span-3">
          <TopThemesChart data={data?.topThemes ?? []} loading={loading} />
        </div>

        {/* Recent Feedback */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Recent Feedback</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Latest submissions</p>
              </div>
              <Link href="/inbox">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  View all
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex gap-2">
                        <div className="skeleton h-3 flex-1 rounded" />
                        <div className="skeleton h-3 w-16 rounded" />
                      </div>
                      <div className="skeleton h-3 w-3/4 rounded" />
                    </div>
                  ))
                : (data?.recentFeedback ?? []).slice(0, 5).map((fb) => (
                    <div key={fb.id} className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <SentimentBadge sentiment={fb.sentiment} />
                        <span className="text-[11px] text-neutral-400 shrink-0">
                          {formatDate(fb.createdAt, true)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 line-clamp-2 leading-relaxed">
                        {fb.content}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-1.5">{fb.customerLabel}</p>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/ask" className="group">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-brand-300 hover:bg-brand-50 transition-all duration-150">
              <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 group-hover:bg-brand-200 transition-colors">
                <Sparkles className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">Ask LOOP</p>
                <p className="text-xs text-neutral-500">Query your feedback with AI</p>
              </div>
            </div>
          </Link>
          <Link href="/reports" className="group">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-accent-300 hover:bg-accent-50 transition-all duration-150">
              <div className="w-9 h-9 rounded-lg bg-accent-100 flex items-center justify-center shrink-0 group-hover:bg-accent-200 transition-colors">
                <Zap className="h-4 w-4 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">Generate Report</p>
                <p className="text-xs text-neutral-500">Create a VoC report</p>
              </div>
            </div>
          </Link>
          <Link href="/trends" className="group">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 hover:border-success-300 hover:bg-success-50 transition-all duration-150">
              <div className="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center shrink-0 group-hover:bg-success-200 transition-colors">
                <TrendingUp className="h-4 w-4 text-success-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">View Trends</p>
                <p className="text-xs text-neutral-500">Explore emerging themes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
