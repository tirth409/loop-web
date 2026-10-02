"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  Plus,
  Upload,
  Radio,
  Filter,
  X,
  Eye,
  ChevronDown,
} from "lucide-react";
import { getThemes } from "@/lib/api/themes";
import { toast } from "sonner";
import { getFeedback, updateFeedbackStatus } from "@/lib/api/feedback";
import type {
  Feedback,
  FeedbackFilters,
  FeedbackStatus,
  Channel,
  Sentiment,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, SentimentBadge, StatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Drawer } from "@/components/ui/Drawer";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AddFeedbackModal } from "@/components/feedback/AddFeedbackModal";
import { CsvUploadModal } from "@/components/feedback/CsvUploadModal";
import { ChannelIngestModal } from "@/components/feedback/ChannelIngestModal";
import { FeedbackDetail } from "@/components/feedback/FeedbackDetail";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

const CHANNEL_OPTIONS = [
  { value: "", label: "All Channels" },
  { value: "SUPPORT_TICKET", label: "Support Ticket" },
  { value: "APP_STORE", label: "App Store" },
  { value: "NPS_SURVEY", label: "NPS Survey" },
  { value: "SALES_CALL", label: "Sales Call" },
  { value: "COMMUNITY", label: "Community" },
  { value: "OTHER", label: "Other" },
];

const SENTIMENT_OPTIONS = [
  { value: "", label: "All Sentiments" },
  { value: "POSITIVE", label: "Positive" },
  { value: "NEUTRAL", label: "Neutral" },
  { value: "NEGATIVE", label: "Negative" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTIONED", label: "Actioned" },
];

const CHANNEL_LABELS: Record<string, string> = {
  SUPPORT_TICKET: "Support",
  APP_STORE: "App Store",
  NPS_SURVEY: "NPS",
  SALES_CALL: "Sales",
  COMMUNITY: "Community",
  OTHER: "Other",
};

function StatusDropdown({
  id,
  current,
  onChange,
  disabled,
}: {
  id: string;
  current: FeedbackStatus;
  onChange: (id: string, status: FeedbackStatus) => void;
  disabled?: boolean;
}) {
  const options: FeedbackStatus[] = ["NEW", "REVIEWED", "ACTIONED"];
  return (
    <select
      value={current}
      onChange={(e) => onChange(id, e.target.value as FeedbackStatus)}
      disabled={disabled}
      className={cn(
        "text-xs font-medium rounded-full px-2 py-1 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors",
        current === "NEW" && "bg-blue-50 text-blue-700 border-blue-200",
        current === "REVIEWED" &&
          "bg-warning-50 text-warning-600 border-warning-100",
        current === "ACTIONED" &&
          "bg-success-50 text-success-700 border-success-100",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {options.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}

export default function InboxPage() {
  const perms = usePermissions();
  const [filters, setFilters] = useState<FeedbackFilters>({
    page: 1,
    pageSize: 10,
  });
  const [searchInput, setSearchInput] = useState("");
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [detailFeedback, setDetailFeedback] = useState<Feedback | null>(null);
  const [themeNames, setThemeNames] = useState<string[]>([]);

  const loadThemes = useCallback(async () => {
    try {
      const themes = await getThemes();
      setThemeNames(
        themes.map((t) => t.name).sort((a, b) => a.localeCompare(b)),
      );
    } catch {
      // The theme filter is optional; the inbox still works without it.
    }
  }, []);

  React.useEffect(() => {
    loadThemes();
  }, [loadThemes]);
  const fetchFeedback = useCallback(async (f: FeedbackFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFeedback(f);
      setFeedbackList(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchFeedback(filters);
  }, [filters, fetchFeedback]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const handleFilterChange = (key: keyof FeedbackFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  };

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    setUpdatingId(id);
    try {
      await updateFeedbackStatus(id, status);
      setFeedbackList((list) =>
        list.map((f) => (f.id === id ? { ...f, status } : f)),
      );
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, pageSize: 10 });
    setSearchInput("");
  };

  const hasActiveFilters =
    filters.search ||
    filters.channel ||
    filters.sentiment ||
    filters.status ||
    filters.theme ||
    filters.dateFrom ||
    filters.dateTo;
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Feedback Inbox</h1>
          <p className="page-subtitle">
            Manage and review all customer feedback
          </p>
        </div>
        {perms.canManageFeedback && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChannelOpen(true)}
              leftIcon={<Radio className="h-3.5 w-3.5" />}
            >
              Simulate Channel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCsvOpen(true)}
              leftIcon={<Upload className="h-3.5 w-3.5" />}
            >
              CSV Upload
            </Button>
            <Button
              size="sm"
              onClick={() => setAddOpen(true)}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Feedback
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              placeholder="Search feedback, customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftAddon={<Search className="h-4 w-4" />}
              wrapperClassName="flex-1"
            />
            <Button type="submit" variant="outline" size="md">
              Search
            </Button>
          </form>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filters.channel ?? ""}
              onChange={(e) => handleFilterChange("channel", e.target.value)}
              className="form-input w-auto"
              aria-label="Filter by channel"
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.sentiment ?? ""}
              onChange={(e) => handleFilterChange("sentiment", e.target.value)}
              className="form-input w-auto"
              aria-label="Filter by sentiment"
            >
              {SENTIMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status ?? ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="form-input w-auto"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={filters.theme ?? ""}
              onChange={(e) => handleFilterChange("theme", e.target.value)}
              className="form-input w-auto"
              aria-label="Filter by theme"
            >
              <option value="">All Themes</option>
              {themeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              From
              <input
                type="date"
                value={filters.dateFrom ?? ""}
                max={filters.dateTo || undefined}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="form-input w-auto"
                aria-label="From date"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-neutral-500">
              To
              <input
                type="date"
                value={filters.dateTo ?? ""}
                min={filters.dateFrom || undefined}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="form-input w-auto"
                aria-label="To date"
              />
            </label>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="md"
                onClick={clearFilters}
                leftIcon={<X className="h-3.5 w-3.5" />}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={() => fetchFeedback(filters)}
          />
        ) : feedbackList.length === 0 ? (
          <EmptyState
            title="No feedback found"
            description={
              hasActiveFilters
                ? "No feedback matches your current filters. Try adjusting them."
                : "No feedback has been added yet. Import or add your first feedback item."
            }
            action={
              perms.canManageFeedback
                ? { label: "Add Feedback", onClick: () => setAddOpen(true) }
                : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 300 }}>Feedback</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Sentiment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((fb) => (
                    <tr key={fb.id}>
                      <td>
                        <p className="text-sm text-neutral-800 line-clamp-2 max-w-xs">
                          {fb.content}
                        </p>
                        {fb.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {fb.themes.slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] rounded font-medium"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant="neutral">
                          {CHANNEL_LABELS[fb.channel] ?? fb.channel}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-sm text-neutral-700">
                          {fb.customerLabel}
                        </span>
                      </td>
                      <td>
                        <SentimentBadge sentiment={fb.sentiment} />
                      </td>
                      <td>
                        {perms.canManageFeedback ? (
                          <StatusDropdown
                            id={fb.id}
                            current={fb.status}
                            onChange={handleStatusChange}
                            disabled={updatingId === fb.id}
                          />
                        ) : (
                          <StatusBadge status={fb.status} />
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-neutral-400">
                          {formatDate(fb.createdAt, true)}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setDetailFeedback(fb)}
                          className="p-1.5 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          aria-label="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-neutral-100">
              {feedbackList.map((fb) => (
                <div key={fb.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <SentimentBadge sentiment={fb.sentiment} />
                    <span className="text-[11px] text-neutral-400">
                      {formatDate(fb.createdAt, true)}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-800 leading-relaxed">
                    {fb.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="neutral">
                        {CHANNEL_LABELS[fb.channel]}
                      </Badge>
                      <StatusBadge status={fb.status} />
                    </div>
                    <button
                      onClick={() => setDetailFeedback(fb)}
                      className="text-xs text-brand-600 font-medium hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={filters.page ?? 1}
              totalPages={totalPages}
              total={total}
              pageSize={filters.pageSize ?? 10}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <AddFeedbackModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          fetchFeedback(filters);
          loadThemes();
          toast.success("Feedback added successfully");
        }}
      />
      <CsvUploadModal
        isOpen={csvOpen}
        onClose={() => setCsvOpen(false)}
        onSuccess={() => {
          setCsvOpen(false);
          fetchFeedback(filters);
          loadThemes();
        }}
      />
      <ChannelIngestModal
        isOpen={channelOpen}
        onClose={() => setChannelOpen(false)}
        onSuccess={() => {
          setChannelOpen(false);
          fetchFeedback(filters);
          loadThemes();
        }}
      />
      <Drawer
        isOpen={!!detailFeedback}
        onClose={() => setDetailFeedback(null)}
        title="Feedback Detail"
        size="md"
      >
        {detailFeedback && (
          <FeedbackDetail
            feedback={detailFeedback}
            onReclassified={(updated) => {
              setDetailFeedback(updated);
              setFeedbackList((list) =>
                list.map((f) => (f.id === updated.id ? updated : f)),
              );
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
