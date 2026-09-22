import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-6">
        <FileQuestion className="h-8 w-8 text-neutral-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
      <p className="text-neutral-500 text-center max-w-sm mb-8">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Link href="/dashboard">
        <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
