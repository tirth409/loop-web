"use client";

import React from "react";
import { Menu, Bell, Search, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      className={cn(
        "h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6 shrink-0",
        className
      )}
    >
      {/* Left: mobile menu + logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-neutral-900">LOOP</span>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </button>

        {user && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200 ml-1">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {getInitials(user.name)}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-neutral-900 leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-neutral-500">{user.workspaceName}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
