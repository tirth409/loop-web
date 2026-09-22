"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileType, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { uploadCsv } from "@/lib/api/feedback";
import type { CsvUploadResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvUploadModal({ isOpen, onClose, onSuccess }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a valid CSV file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadCsv(file);
      setResult(res);
      if (res.failed === 0) {
        toast.success(`Successfully imported ${res.imported} feedback items`);
      } else {
        toast.warning(`Imported ${res.imported} items with ${res.failed} failures`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
    if (result) onSuccess(); // Refresh if we uploaded something
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload CSV"
      description="Bulk import feedback from a CSV file."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={uploading}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              loading={uploading}
            >
              Upload
            </Button>
          )}
        </>
      }
    >
      {!result ? (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors",
              isDragging ? "border-brand-500 bg-brand-50" : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
            )}
          >
            {file ? (
              <>
                <FileType className="h-8 w-8 text-brand-600 mb-3" />
                <p className="text-sm font-medium text-neutral-900">{file.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-xs text-danger-600 mt-3 font-medium hover:underline"
                >
                  Remove file
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-sm font-medium text-neutral-900">
                  Drag & drop your CSV file here
                </p>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  or click to browse from your computer
                </p>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Browse File
                </Button>
              </>
            )}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg">
            <p className="font-semibold mb-1">Expected CSV Format:</p>
            <p>Columns: <code>content</code> (required), <code>channel</code>, <code>customerLabel</code>, <code>sourceRef</code></p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            {result.failed === 0 ? (
              <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-warning-600" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-900">Import Complete</h3>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">{result.imported}</p>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Imported</p>
              </div>
              <div className="w-px h-8 bg-neutral-200" />
              <div className="text-center">
                <p className={cn("text-2xl font-bold", result.failed > 0 ? "text-danger-600" : "text-neutral-900")}>
                  {result.failed}
                </p>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Failed</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-danger-50 border border-danger-100 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-danger-800 mb-2">Error Details:</p>
              <ul className="space-y-1 text-xs text-danger-700">
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
