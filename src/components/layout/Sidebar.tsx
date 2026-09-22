"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Feedback Inbox", icon: MessageSquare },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/ask", label: "Ask LOOP", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex flex-col h-full w-full bg-white border-r border-neutral-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-neutral-200 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-neutral-900 tracking-tight">
              LOOP
            </span>
            <span className="block text-[10px] text-neutral-400 font-medium -mt-0.5 uppercase tracking-widest">
              Intelligence
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn("sidebar-link", isActive && "active")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Workspace indicator */}
      {user && (
        <div className="px-3 pb-1">
          <div className="px-3 py-2.5 rounded-lg bg-brand-50 border border-brand-100">
            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest mb-0.5">
              Workspace
            </p>
            <p className="text-xs font-semibold text-brand-800 truncate">
              {user.workspaceName}
            </p>
          </div>
        </div>
      )}

      {/* User section */}
      {user && (
        <div className="p-3 border-t border-neutral-200 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-white">
                {getInitials(user.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.role}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
