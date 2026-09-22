"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-danger-500" />
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p className="text-neutral-500 text-center max-w-sm mb-8">
        You don't have permission to view this page. Please contact your workspace administrator if you believe this is a mistake.
      </p>
      <Link href="/dashboard">
        <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
