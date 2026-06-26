"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, ExternalLink, UserRound, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/features/layout";
import { StatCard } from "@/features/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getApiError } from "@/lib/api";
import { kycApi } from "../../../kyc/api/kyc-api";
import { cn } from "@/lib/utils";
import { useAuth } from "../../../auth/context/auth-context";
import { getDocument, KycReviewPanel, StatusBadge } from "../components/kyc-review-panel";

export default function AdminKycPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const queryClient = useQueryClient();
  const { user, token, ready } = useAuth();

  const list = useQuery({
    queryKey: ["admin-kyc-list"],
    queryFn: kycApi.adminList,
    enabled: ready && Boolean(token)
  });
  const detail = useQuery({
    queryKey: ["admin-kyc-detail", selectedId],
    queryFn: () => kycApi.adminGet(selectedId),
    enabled: ready && Boolean(token) && Boolean(selectedId)
  });

  useEffect(() => {
    if (!selectedId && list.data?.length) {
      setSelectedId(list.data[0]._id);
    }
  }, [list.data, selectedId]);

  const stats = useMemo(() => {
    const applications = list.data || [];
    return {
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending_admin_review").length,
      approved: applications.filter((item) => item.status === "approved").length,
      rejected: applications.filter((item) => ["rejected", "failed"].includes(item.status)).length
    };
  }, [list.data]);

  const approve = useMutation({
    mutationFn: () => kycApi.approve(selectedId, remarks),
    onSuccess() {
      toast.success("KYC approved");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail", "kyc", selectedId] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const reject = useMutation({
    mutationFn: () => kycApi.reject(selectedId, remarks),
    onSuccess() {
      toast.success("KYC rejected");
      setRemarks("");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-kyc-detail", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail", "kyc", selectedId] });
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
    <AdminShell title="Admin Dashboard" logo="A">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Card className="finboard-card">
            <CardContent className="flex flex-col items-center gap-2 pt-6 text-center">
              <Avatar size="lg">
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "A"}</AvatarFallback>
              </Avatar>
              <strong className="text-base">{user?.name || "Admin"}</strong>
              <Badge variant="secondary" className="rounded-full">
                {user?.role || "admin"}
              </Badge>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </CardContent>
          </Card>

          <Card className="finboard-card-sage">
            <CardHeader>
              <CardTitle className="text-base">Admin Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Access</span>
                <strong>KYC Review</strong>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Module</span>
                <strong>Identity Verification</strong>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Action</span>
                <strong>Approve / Reject</strong>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={UserRound} label="Users" value={stats.total} />
            <StatCard icon={Clock3} label="Pending" value={stats.pending} tone="warning" />
            <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} tone="success" />
            <StatCard icon={XCircle} label="Needs Review" value={stats.rejected} tone="danger" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="finboard-card">
              <CardHeader>
                <CardDescription>User List</CardDescription>
                <CardTitle>Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[min(70vh,640px)]">
                  <div className="space-y-1 p-4 pt-0">
                    {(list.data || []).map((item) => (
                      <div
                        key={item._id}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border p-3 transition-colors",
                          selectedId === item._id
                            ? "border-primary bg-accent"
                            : "border-transparent hover:border-foreground/10 hover:bg-secondary"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(item._id)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <Avatar size="sm">
                            <AvatarFallback>{item.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong className="text-sm">{item.name}</strong>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{item.user?.email || "No user email"}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.panNumber} / {item.aadhaarNumber}
                            </p>
                          </div>
                        </button>
                        <Button variant="ghost" size="icon-sm" className="shrink-0 rounded-full" asChild>
                          <Link href={`/admin/kyc/${item._id}`} aria-label={`Open ${item.name} detail`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    {list.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading users...</p> : null}
                    {!list.isLoading && (list.data || []).length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">No KYC users submitted yet.</p>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

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
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
