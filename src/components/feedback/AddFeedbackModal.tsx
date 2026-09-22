"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { addFeedback } from "@/lib/api/feedback";
import type { Channel } from "@/lib/types";

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CHANNEL_OPTIONS = [
  { value: "SUPPORT_TICKET", label: "Support Ticket" },
  { value: "APP_STORE", label: "App Store" },
  { value: "NPS_SURVEY", label: "NPS Survey" },
  { value: "SALES_CALL", label: "Sales Call" },
  { value: "COMMUNITY", label: "Community" },
  { value: "OTHER", label: "Other" },
];

export function AddFeedbackModal({ isOpen, onClose, onSuccess }: AddFeedbackModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    content: "",
    channel: "SUPPORT_TICKET" as Channel,
    customerLabel: "",
    sourceRef: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.content.trim()) errs.content = "Feedback content is required";
    if (!form.channel) errs.channel = "Channel is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await addFeedback(form);
      setForm({
        content: "",
        channel: "SUPPORT_TICKET",
        customerLabel: "",
        sourceRef: "",
      });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add feedback");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Feedback"
      description="Manually input customer feedback."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Submit Feedback
          </Button>
        </>
      }
    >
      <form id="add-feedback-form" onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="Feedback Content"
          placeholder="What did the customer say?"
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          error={errors.content}
          rows={4}
          autoFocus
        />
        <Select
          label="Source Channel"
          options={CHANNEL_OPTIONS}
          value={form.channel}
          onChange={(e) => update("channel", e.target.value)}
          error={errors.channel}
        />
        <Input
          label="Customer Info (Optional)"
          placeholder="e.g. Enterprise Client, Jane Doe"
          value={form.customerLabel}
          onChange={(e) => update("customerLabel", e.target.value)}
        />
        <Input
          label="Source Reference (Optional)"
          placeholder="e.g. Ticket #12345"
          value={form.sourceRef}
          onChange={(e) => update("sourceRef", e.target.value)}
        />
      </form>
    </Modal>
  );
}
