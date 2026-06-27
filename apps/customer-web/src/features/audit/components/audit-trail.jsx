"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { auditApi } from "../api/audit-api";
import {
  actionLabel,
  actionTone,
  formatActor,
  formatAiVerificationSummary,
  formatDetailsSummary
} from "../lib/audit-formatters";

function AuditEntryDetails({ entry }) {
  const summary = formatDetailsSummary(entry.details);
  const aiSummary = formatAiVerificationSummary(entry.details?.aiVerification);
  const hasRawDetails = entry.details && Object.keys(entry.details).length > 0;

  return (
    <div className="space-y-2">
      {summary ? <p className="text-sm text-muted-foreground">{summary}</p> : null}
      {aiSummary ? <p className="text-sm text-muted-foreground">{aiSummary}</p> : null}
      {hasRawDetails ? (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <ChevronDown className="size-3" />
            View full event details
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

export function AuditTrail({ resourceType, resourceId, className, title = "Audit Trail", compact = false }) {
  const auditTrail = useQuery({
    queryKey: ["audit-trail", resourceType, resourceId],
    queryFn: () => auditApi.byResource(resourceType, resourceId),
    enabled: Boolean(resourceType && resourceId)
  });

  const entries = auditTrail.data || [];

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription>Compliance</CardDescription>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" />
            {title}
          </CardTitle>
        </div>
        <Badge variant="secondary">{entries.length} events</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn("rounded-lg border border-border", compact ? "h-64" : "h-[min(70vh,480px)]")}>
          {auditTrail.isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading audit history...</p>
          ) : null}
          {auditTrail.isError ? (
            <p className="p-4 text-sm text-[var(--negative)]">{getApiError(auditTrail.error)}</p>
          ) : null}
          {!auditTrail.isLoading && !auditTrail.isError && entries.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : null}
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry._id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className={cn("font-medium", actionTone(entry.action))}>
                    {actionLabel(entry.action)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Actor: {formatActor(entry)}
                  {entry.ipAddress ? ` · IP ${entry.ipAddress}` : ""}
                </p>
                <AuditEntryDetails entry={entry} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
