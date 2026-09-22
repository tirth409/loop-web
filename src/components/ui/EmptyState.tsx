import React from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
        {icon || <MessageSquare className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-neutral-800 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-6 w-6 text-danger-500" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-800 mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-xs">{description}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
