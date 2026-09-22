"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mb-4",
            variant === "danger" ? "bg-danger-50" : "bg-brand-50"
          )}
        >
          <AlertTriangle
            className={cn(
              "h-6 w-6",
              variant === "danger" ? "text-danger-500" : "text-brand-500"
            )}
          />
        </div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Modal>
  );
}
