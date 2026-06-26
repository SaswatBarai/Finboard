"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/features/layout";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/api";
import { kycApi } from "../../../kyc/api/kyc-api";
import { useAuth } from "../../../auth/context/auth-context";
import { getDocument, KycReviewPanel, StatusBadge } from "../components/kyc-review-panel";

export default function AdminKycDetailScreen({ applicationId }) {
  const [remarks, setRemarks] = useState("");
  const queryClient = useQueryClient();
  const { token, ready } = useAuth();

  const detail = useQuery({
    queryKey: ["admin-kyc-detail", applicationId],
    queryFn: () => kycApi.adminGet(applicationId),
    enabled: ready && Boolean(token) && Boolean(applicationId)
  });

  const approve = useMutation({
    mutationFn: () => kycApi.approve(applicationId, remarks),
    onSuccess() {
      toast.success("KYC approved");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail", "kyc", applicationId] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const reject = useMutation({
    mutationFn: () => kycApi.reject(applicationId, remarks),
    onSuccess() {
      toast.success("KYC rejected");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail", "kyc", applicationId] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const selected = detail.data;
  const review = selected?.adminReview;
  const panDoc = getDocument(review, "pan");
  const aadhaarDoc = getDocument(review, "aadhaar");

  return (
    <AdminShell title="KYC Application Review" logo="K">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="size-4" />
              Back to queue
            </Link>
          </Button>
          {selected?.application?.status ? <StatusBadge status={selected.application.status} /> : null}
        </div>

        {detail.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading application...</p>
        ) : detail.isError ? (
          <p className="text-sm text-[var(--negative)]">Unable to load this KYC application.</p>
        ) : (
          <KycReviewPanel
            selected={selected}
            review={review}
            panDoc={panDoc}
            aadhaarDoc={aadhaarDoc}
            remarks={remarks}
            onRemarksChange={setRemarks}
            onApprove={() => approve.mutate()}
            onReject={() => reject.mutate()}
            isApproving={approve.isPending}
            isRejecting={reject.isPending}
            emptyMessage="Application not found."
          />
        )}
      </div>
    </AdminShell>
  );
}
