"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Search,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { getThemes } from "@/lib/api/themes";
import type { Theme, VolumeDataPoint } from "@/lib/types";
import { ErrorState, EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge, SentimentBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatNumber, formatPct } from "@/lib/helpers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Drawer } from "@/components/ui/Drawer";

function ThemeVolumeChart({ data }: { data: VolumeDataPoint[] }) {
  return (
    <div className="h-32 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="themeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#themeGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrendsPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  const fetchThemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThemes();
      setThemes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load themes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const filteredThemes = themes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const emergingThemes = themes.filter((t) => t.isSpike);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Trends & Themes</h1>
        <p className="page-subtitle">
          AI-detected patterns across all customer feedback
        </p>
      </div>

      {error && !loading && <ErrorState description={error} onRetry={fetchThemes} />}

      {/* Emerging Themes Highlight */}
      {!loading && !error && emergingThemes.length > 0 && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-brand-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-brand-700 font-semibold">
              <Sparkles className="h-4 w-4" /> Emerging Trends Detected
            </div>
            <div className="flex flex-wrap gap-3">
              {emergingThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  className="bg-white border border-brand-200 shadow-sm rounded-lg px-4 py-2 flex items-center gap-3 hover:border-brand-400 hover:shadow-card-md transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-danger-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-0.5" /> +{t.growthPct}%
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium bg-neutral-100 px-1.5 py-0.5 rounded">
                        {t.feedbackCount} items
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-lg font-semibold text-neutral-900">All Themes</h2>
        <Input
          placeholder="Search themes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search className="h-4 w-4" />}
          wrapperClassName="w-64"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 h-64">
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-6" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : filteredThemes.length === 0 ? (
        <EmptyState title="No themes found" description="Try adjusting your search criteria." />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredThemes.map((theme) => {
            const domSentiment =
              theme.sentiment.negative > theme.sentiment.positive
                ? "NEGATIVE"
                : theme.sentiment.positive > theme.sentiment.neutral
                ? "POSITIVE"
                : "NEUTRAL";

            return (
              <div
                key={theme.id}
                className="card p-5 hover:shadow-card-md transition-all cursor-pointer border hover:border-brand-300 group"
                onClick={() => setSelectedTheme(theme)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-neutral-900 truncate">
                        {theme.name}
                      </h3>
                      {theme.isSpike && (
                        <Badge variant="danger" className="text-[10px] px-1.5 bg-danger-100">
                          Spike
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-1">{theme.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-neutral-900">
                      {formatNumber(theme.feedbackCount)}
                    </p>
                    <div
                      className={cn(
                        "flex items-center justify-end gap-0.5 text-xs font-semibold mt-0.5",
                        theme.growthPct >= 0 ? "text-danger-600" : "text-success-600"
                      )}
                    >
                      {theme.growthPct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPct(Math.abs(theme.growthPct))}
                    </div>
                  </div>
                </div>

                <ThemeVolumeChart data={theme.volumeOverTime} />

                <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 font-medium">Dominant Sentiment:</span>
                    <SentimentBadge sentiment={domSentiment} />
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" rightIcon={<ArrowUpRight className="h-4 w-4"/>}>
                    Analyze
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theme Drill-down Drawer */}
      <Drawer
        isOpen={!!selectedTheme}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme?.name}
        description={selectedTheme?.description}
        size="lg"
      >
        {selectedTheme && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-1">Total Feedback</p>
                <p className="text-2xl font-bold text-neutral-900">{selectedTheme.feedbackCount}</p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-1">Growth (30d)</p>
                <p className={cn("text-2xl font-bold flex items-center", selectedTheme.growthPct >= 0 ? "text-danger-600" : "text-success-600")}>
                  {selectedTheme.growthPct >= 0 ? "+" : ""}{selectedTheme.growthPct}%
                </p>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-xs font-medium text-neutral-500 mb-2">Sentiment Split</p>
                <div className="flex h-2.5 w-full rounded-full overflow-hidden">
                  <div style={{ width: `${selectedTheme.sentiment.positive}%` }} className="bg-success-500" title={`Positive: ${selectedTheme.sentiment.positive}%`} />
                  <div style={{ width: `${selectedTheme.sentiment.neutral}%` }} className="bg-neutral-300" title={`Neutral: ${selectedTheme.sentiment.neutral}%`} />
                  <div style={{ width: `${selectedTheme.sentiment.negative}%` }} className="bg-danger-500" title={`Negative: ${selectedTheme.sentiment.negative}%`} />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-neutral-400 font-medium">
                  <span>+{selectedTheme.sentiment.positive}%</span>
                  <span>-{selectedTheme.sentiment.negative}%</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Volume Over Time</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedTheme.volumeOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={0.1} fill="#6366f1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Related Feedback (Mock) */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Recent Items in Theme</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm flex gap-3 items-start">
                    <MessageSquare className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-neutral-800 leading-relaxed mb-2">
                        "Sample feedback related to {selectedTheme.name.toLowerCase()}. The user expressed concern about this specific area."
                      </p>
                      <div className="flex gap-2">
                        <SentimentBadge sentiment={i % 2 === 0 ? "NEGATIVE" : "NEUTRAL"} />
                        <span className="text-xs text-neutral-400 mt-0.5">2 days ago</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">View all {selectedTheme.feedbackCount} items</Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
