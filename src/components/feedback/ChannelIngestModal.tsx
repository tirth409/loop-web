"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ingestChannel } from "@/lib/api/feedback";
import { CheckCircle2, Radio } from "lucide-react";

interface ChannelIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INGEST_OPTIONS = [
  { value: "Zendesk", label: "Zendesk (Support Tickets)" },
  { value: "AppStore", label: "Apple App Store Reviews" },
  { value: "GooglePlay", label: "Google Play Reviews" },
  { value: "Typeform", label: "Typeform (NPS Surveys)" },
  { value: "Gong", label: "Gong (Sales Calls)" },
];

export function ChannelIngestModal({ isOpen, onClose, onSuccess }: ChannelIngestModalProps) {
  const [channel, setChannel] = useState(INGEST_OPTIONS[0].value);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<{ imported: number } | null>(null);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await ingestChannel(channel);
      setResult(res);
      toast.success(`Successfully imported ${res.imported} items from ${channel}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to ingest channel");
    } finally {
      setIngesting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setChannel(INGEST_OPTIONS[0].value);
    onClose();
    if (result) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Simulate Channel Ingestion"
      description="Mock importing feedback from a third-party channel."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={ingesting}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button onClick={handleIngest} loading={ingesting}>
              Start Import
            </Button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="space-y-4">
          <Select
            label="Select Channel"
            options={INGEST_OPTIONS}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
          <div className="bg-neutral-50 rounded-lg p-3 text-xs text-neutral-500 flex items-start gap-2">
            <Radio className="h-4 w-4 shrink-0 text-neutral-400" />
            <p>
              This is a simulated ingestion. It will randomly generate mock feedback items and add them to your inbox. 
              Real third-party integrations are outside the scope of this project.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900">Import Complete</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Successfully pulled in <span className="font-bold text-neutral-900">{result.imported}</span> new feedback items from {channel}.
          </p>
        </div>
      )}
    </Modal>
  );
}
