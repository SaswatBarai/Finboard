"use client";

import { FileSearch, ShieldCheck } from "lucide-react";
import { AuditTrail } from "@/features/audit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  : "";

export function getDocument(review, type) {
  return review?.documents?.find((document) => document.type === type);
}

export function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

export function isKycReviewable(status) {
  return status === "pending_admin_review";
}

export function statusLabel(status) {
  const map = {
    pending_admin_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    failed: "Failed",
    reupload_requested: "Reupload"
  };
  return map[status] || status || "Unknown";
}

export function statusBadgeClass(status) {
  const map = {
    pending_admin_review: "border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning-content,#4a3b1c)]",
    approved: "border-[var(--positive-deep)]/20 bg-[var(--primary-pale)] text-[var(--positive-deep)]",
    rejected: "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]",
    failed: "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]",
    reupload_requested: "border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning-content,#4a3b1c)]"
  };
  return map[status] || "";
}

export function StatusBadge({ status }) {
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", statusBadgeClass(status))}>
      {statusLabel(status)}
    </Badge>
  );
}

export function CheckPill({ label, value }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-normal",
        value
          ? "border-[var(--positive-deep)]/20 bg-[var(--primary-pale)] text-[var(--positive-deep)]"
          : "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]"
      )}
    >
      {label}: {value ? "Matched" : "Review"}
    </Badge>
  );
}

export function ReviewValueRow({ label, entered, seeded, ocr, requireOcr = false }) {
  const baseMatched = normalize(entered) && normalize(entered) === normalize(seeded);
  const ocrMatched = !requireOcr || normalize(entered) === normalize(ocr);
  const ok = baseMatched && ocrMatched;

  return (
    <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 px-3 py-2.5 text-sm last:border-b-0">
      <strong className="font-medium">{label}</strong>
      <span className="text-muted-foreground">{entered || "Not entered"}</span>
      <span className="text-muted-foreground">{seeded || "Not found"}</span>
      <span className="text-muted-foreground">{ocr || "Not extracted"}</span>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 rounded-full",
          ok
            ? "border-[var(--positive-deep)]/20 bg-[var(--primary-pale)] text-[var(--positive-deep)]"
            : "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]"
        )}
      >
        {ok ? "OK" : "Review"}
      </Badge>
    </div>
  );
}

export function UploadedDocument({ document }) {
  if (!document) {
    return null;
  }

  const src = `${apiBase}${document.url}`;
  const isImage = /\.(png|jpe?g|webp)$/i.test(document.url || "");

  return (
    <Card className="finboard-card-sage">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm">{document.type.toUpperCase()} Upload</CardTitle>
        <Button variant="link" size="sm" className="h-auto p-0" asChild>
          <a href={src} target="_blank" rel="noreferrer">
            Open file
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {isImage ? (
          <img src={src} alt={`${document.type} upload`} className="w-full rounded-2xl border border-foreground/10 object-contain" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-card text-sm text-muted-foreground">
            PDF document
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RawOcrBlock({ title, document }) {
  return (
    <Card className="finboard-card-sage">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <Badge variant="secondary" className="rounded-full">
          {document?.extractionSource || "not_extracted"}
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 rounded-2xl border border-foreground/10 bg-card">
          <pre className="p-3 text-xs whitespace-pre-wrap text-muted-foreground">
            {document?.ocrText || document?.ocrPreview || "No OCR text captured yet."}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function KycReviewPanel({
  selected,
  review,
  panDoc,
  aadhaarDoc,
  remarks,
  onRemarksChange,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  emptyMessage = "Select a user from the list to review uploaded documents and OCR extracted data."
}) {
  const isReviewable = isKycReviewable(selected?.application?.status);
  const actionsDisabled = isApproving || isRejecting || !isReviewable;

  return (
    <Card className="finboard-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription>Review</CardDescription>
          <CardTitle>User Details</CardTitle>
        </div>
        {selected?.application?.status ? <StatusBadge status={selected.application.status} /> : null}
      </CardHeader>
      <CardContent>
        {selected ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Full Name</span>
                <p className="font-medium">{selected.application.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Email</span>
                <p className="font-medium">{selected.user?.email || "Not found"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Phone</span>
                <p className="font-medium">{selected.user?.phone || "Not found"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <p className="font-medium">
                  {new Date(selected.application.submittedAt || selected.application.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <CheckPill label="Identity exists" value={review?.checks?.identityExists} />
              <CheckPill label="Name" value={review?.checks?.nameMatchesDataset} />
              <CheckPill label="PAN" value={review?.checks?.panMatchesDataset} />
              <CheckPill label="Aadhaar" value={review?.checks?.aadhaarMatchesDataset} />
              <CheckPill label="PAN OCR" value={review?.checks?.panOcrMatches} />
              <CheckPill label="Aadhaar OCR" value={review?.checks?.aadhaarOcrMatches} />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-foreground/10">
              <div className="grid min-w-[640px] grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 border-b border-foreground/10 bg-secondary px-3 py-2.5 text-xs font-medium text-muted-foreground">
                <strong>Field</strong>
                <span>User entered</span>
                <span>Database value</span>
                <span>OCR extracted</span>
                <span>Result</span>
              </div>
              <ReviewValueRow
                label="Name"
                entered={review?.entered?.name}
                seeded={review?.seeded?.name}
                ocr={panDoc?.extracted?.name || aadhaarDoc?.extracted?.name}
              />
              <ReviewValueRow
                label="PAN"
                entered={review?.entered?.panNumber}
                seeded={review?.seeded?.panNumber}
                ocr={panDoc?.extracted?.panNumber}
              />
              <ReviewValueRow
                label="Aadhaar"
                entered={review?.entered?.aadhaarNumber}
                seeded={review?.seeded?.aadhaarNumber}
                ocr={aadhaarDoc?.extracted?.aadhaarNumber}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadedDocument document={panDoc} />
              <UploadedDocument document={aadhaarDoc} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <RawOcrBlock title="PAN OCR Extracted Data" document={panDoc} />
              <RawOcrBlock title="Aadhaar OCR Extracted Data" document={aadhaarDoc} />
            </div>

            <AuditTrail resourceType="kyc" resourceId={selected.application._id} />

            <Textarea
              placeholder="Write admin remarks before action"
              value={remarks}
              onChange={(event) => onRemarksChange(event.target.value)}
              disabled={!isReviewable}
            />

            {!isReviewable && selected?.application?.status ? (
              <p className="text-sm text-muted-foreground">
                This application is already <strong>{statusLabel(selected.application.status)}</strong>. Approve and reject actions are disabled.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={actionsDisabled} onClick={onApprove}>
                <ShieldCheck className="size-4" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button type="button" variant="outline" disabled={actionsDisabled} onClick={onReject}>
                <FileSearch className="size-4" />
                {isRejecting ? "Rejecting..." : "Reject / Request Fix"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
