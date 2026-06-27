"use client";

import { History, Inbox, Search } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AiScoreBadge, StatusBadge } from "./kyc-review-panel";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending_admin_review", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" }
];

function maskId(value) {
  const raw = String(value || "").replace(/\s/g, "");
  if (raw.length <= 4) {
    return raw || "—";
  }
  return `•••• ${raw.slice(-4)}`;
}

function QueueSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-xl border border-border/60 p-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KycQueuePanel({
  applications,
  selectedId,
  onSelect,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
      <div className="space-y-3 border-b border-border/60 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, email, PAN…"
            className="h-10 rounded-xl border-border/80 bg-background pl-9"
            aria-label="Search applications"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.id;
            return (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "h-8 shrink-0 rounded-full px-3 text-xs font-medium",
                  active && "ring-1 ring-border"
                )}
                onClick={() => onStatusFilterChange(filter.id)}
              >
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isLoading ? (
          <QueueSkeleton />
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">No applications found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try a different search or filter."
                  : "New investor submissions will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1.5 p-2 sm:p-3">
            {applications.map((item) => {
              const selected = selectedId === item._id;
              const pending = item.status === "pending_admin_review";

              return (
                <li key={item._id}>
                  <div
                    className={cn(
                      "group relative flex items-stretch gap-1 rounded-xl border transition-colors",
                      selected
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-transparent hover:border-border/80 hover:bg-muted/40"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(item._id)}
                      className="flex min-w-0 flex-1 items-start gap-3 p-3 text-left"
                    >
                      <span className="relative shrink-0">
                        <Avatar size="sm" className="size-10">
                          <AvatarFallback className="text-xs font-semibold">
                            {item.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {pending ? (
                          <span
                            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-[var(--warning)] ring-2 ring-card"
                            aria-hidden
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="flex items-start justify-between gap-2">
                          <strong className="truncate text-sm leading-tight font-semibold">{item.name}</strong>
                          <AiScoreBadge score={item.aiVerification?.overallScore} />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.user?.email || "No email on file"}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            PAN {maskId(item.panNumber)}
                          </span>
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-col justify-center gap-0.5 pr-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button variant="ghost" size="icon-sm" className="size-8 rounded-lg" asChild>
                        <Link href={`/admin/audit?kycId=${item._id}`} aria-label={`Audit trail for ${item.name}`}>
                          <History className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      {!isLoading && applications.length > 0 ? (
        <div className="border-t border-border/60 px-4 py-2.5 text-center text-[11px] text-muted-foreground">
          {applications.length} application{applications.length === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
