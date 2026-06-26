"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auditApi } from "../api/audit-api";
import { cn } from "@/lib/utils";

const ACTION_LABELS = {
  KYC_SUBMITTED: "KYC Submitted",
  KYC_APPROVED: "KYC Approved",
  KYC_REJECTED: "KYC Rejected"
};

function actionTone(action) {
  if (action === "KYC_APPROVED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (action === "KYC_REJECTED") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400";
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400";
}

function formatDetails(details) {
  if (!details || typeof details !== "object") {
    return null;
  }

  const parts = [];
  if (details.status) parts.push(`Status: ${details.status}`);
  if (details.remarks) parts.push(`Remarks: ${details.remarks}`);
  if (details.checks) parts.push("Automated checks captured");

  return parts.length ? parts.join(" · ") : null;
}

export function AuditTrail({ resourceType, resourceId, className }) {
  const auditTrail = useQuery({
    queryKey: ["audit-trail", resourceType, resourceId],
    queryFn: () => auditApi.byResource(resourceType, resourceId),
    enabled: Boolean(resourceType && resourceId)
  });

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription>Compliance</CardDescription>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" />
            Audit Trail
          </CardTitle>
        </div>
        <Badge variant="secondary">{auditTrail.data?.length || 0} events</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 rounded-lg border border-border">
          {auditTrail.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading audit history...</p>
          ) : null}
          {!auditTrail.isLoading && !(auditTrail.data || []).length ? (
            <p className="p-4 text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : null}
          <div className="divide-y divide-border">
            {(auditTrail.data || []).map((entry) => (
              <div key={entry._id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className={cn("font-medium", actionTone(entry.action))}>
                    {ACTION_LABELS[entry.action] || entry.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Actor: {entry.actorRole || "system"}
                  {entry.ipAddress ? ` · IP ${entry.ipAddress}` : ""}
                </p>
                {formatDetails(entry.details) ? (
                  <p className="text-sm text-muted-foreground">{formatDetails(entry.details)}</p>
                ) : null}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
