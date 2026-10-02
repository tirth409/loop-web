import React, { useState } from "react";
import { toast } from "sonner";
import type { Feedback } from "@/lib/types";
import { Badge, SentimentBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/helpers";
import { Calendar, User, Tag, FileText, Hash, Sparkles } from "lucide-react";
import { reclassifyFeedback } from "@/lib/api/feedback";

export function FeedbackDetail({
  feedback,
  onReclassified,
}: {
  feedback: Feedback;
  onReclassified?: (updated: Feedback) => void;
}) {
  const [reclassifying, setReclassifying] = useState(false);

  const CHANNEL_LABELS: Record<string, string> = {
    SUPPORT_TICKET: "Support Ticket",
    APP_STORE: "App Store",
    NPS_SURVEY: "NPS Survey",
    SALES_CALL: "Sales Call",
    COMMUNITY: "Community",
    OTHER: "Other",
  };

  const handleReclassify = async () => {
    setReclassifying(true);
    try {
      const updated = await reclassifyFeedback(feedback.id);
      onReclassified?.(updated);
      toast.success("Feedback reclassified");
    } catch (err: any) {
      toast.error(err.message || "Failed to reclassify");
    } finally {
      setReclassifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SentimentBadge sentiment={feedback.sentiment} />
          <StatusBadge status={feedback.status} />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReclassify}
          loading={reclassifying}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Re-classify
        </Button>
      </div>

      {/* Content */}
      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
          {feedback.content}
        </p>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <User className="h-3.5 w-3.5" /> Customer
          </div>
          <p className="text-sm text-neutral-900 font-medium">
            {feedback.customerLabel || "Anonymous"}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <FileText className="h-3.5 w-3.5" /> Channel
          </div>
          <p className="text-sm text-neutral-900 font-medium">
            {CHANNEL_LABELS[feedback.channel] ?? feedback.channel}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Calendar className="h-3.5 w-3.5" /> Received Date
          </div>
          <p className="text-sm text-neutral-900 font-medium">
            {formatDate(feedback.createdAt)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
            <Hash className="h-3.5 w-3.5" /> Source Ref
          </div>
          <p className="text-sm text-neutral-900 font-medium">
            {feedback.sourceRef || "None"}
          </p>
        </div>
      </div>

      {/* Themes */}
      <div className="pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 mb-2">
          <Tag className="h-3.5 w-3.5" /> Detected Themes
        </div>
        {feedback.themes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {feedback.themes.map((theme) => (
              <Badge key={theme} variant="neutral">
                {theme}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 italic">No themes detected</p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-[10px] text-neutral-400 font-mono">
        ID: {feedback.id}
      </div>
    </div>
  );
}
