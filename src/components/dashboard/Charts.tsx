"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import type { VolumeDataPoint, SentimentBreakdown, ThemeBar } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Volume Chart ──────────────────────────────────────────────────────────
export function VolumeChart({
  data,
  loading,
}: {
  data: VolumeDataPoint[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Feedback Volume" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader
        title="Feedback Volume"
        description="Feedback received over time"
      />
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.07)",
            }}
            labelStyle={{ fontWeight: 600, color: "#1e293b" }}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="Feedback"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#volGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Sentiment Donut Chart ─────────────────────────────────────────────────
const SENTIMENT_COLORS = {
  Positive: "#22c55e",
  Neutral: "#94a3b8",
  Negative: "#f43f5e",
};

export function SentimentChart({
  data,
  loading,
}: {
  data: SentimentBreakdown;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Sentiment Breakdown" />
        <div className="flex items-center justify-center py-8">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </Card>
    );
  }

  const chartData = [
    { name: "Positive", value: data.positive },
    { name: "Neutral", value: data.neutral },
    { name: "Negative", value: data.negative },
  ];

  return (
    <Card>
      <CardHeader
        title="Sentiment Breakdown"
        description="Distribution across all feedback"
      />
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={SENTIMENT_COLORS[entry.name as keyof typeof SENTIMENT_COLORS]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
              formatter={(val) => [`${Number(val ?? 0)}%`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 pb-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SENTIMENT_COLORS[item.name as keyof typeof SENTIMENT_COLORS] }}
              />
              <span className="text-xs text-neutral-600">
                {item.name}{" "}
                <span className="font-semibold text-neutral-800">{Number(item.value ?? 0)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Top Themes Bar Chart ──────────────────────────────────────────────────
export function TopThemesChart({
  data,
  loading,
}: {
  data: ThemeBar[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader title="Top Themes" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Top Themes"
        description="Most frequent feedback themes"
      />
      <ResponsiveContainer width="100%" height={230}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="theme"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} name="Feedback">
            <LabelList dataKey="count" position="right" style={{ fontSize: "11px", fill: "#64748b", fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
