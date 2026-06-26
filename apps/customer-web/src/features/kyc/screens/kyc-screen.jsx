"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock3, FileCheck2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/features/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { kycApi } from "../api/kyc-api";
import { canSubmitKyc, getKycStatusPresentation } from "../lib/kyc-status";

const statusToneClass = {
  warning: "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning-content,#4a3b1c)]",
  success: "border-[var(--positive-deep)]/20 bg-[var(--primary-pale)] text-[var(--positive-deep)]",
  danger: "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]",
  default: ""
};

export default function KycPage() {
  const [form, setForm] = useState({ name: "", panNumber: "", aadhaarNumber: "", panFile: null, aadhaarFile: null });
  const current = useQuery({ queryKey: ["my-kyc"], queryFn: kycApi.me });
  const submit = useMutation({
    mutationFn: kycApi.submit,
    onSuccess() {
      toast.success("KYC submitted for admin review");
      current.refetch();
      setForm({ name: "", panNumber: "", aadhaarNumber: "", panFile: null, aadhaarFile: null });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const application = current.data?.application;
  const canSubmit = current.data?.canSubmit ?? canSubmitKyc(application);
  const status = getKycStatusPresentation(application);

  function submitKyc(event) {
    event.preventDefault();

    if (!canSubmit) {
      toast.error("You already have a KYC application in progress or approved.");
      return;
    }

    if (!form.name.trim() || !form.panNumber.trim() || !form.aadhaarNumber.trim()) {
      toast.error("Enter name, PAN, and Aadhaar before submitting.");
      return;
    }

    if (!form.panFile || !form.aadhaarFile) {
      toast.error("Upload both PAN and Aadhaar documents.");
      return;
    }

    submit.mutate(form);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-primary">Identity Verification</p>
          <h1 className="text-3xl font-bold tracking-tight">Complete KYC</h1>
        </div>

        {application && !canSubmit ? (
          <Alert className={cn("rounded-2xl", statusToneClass[status.tone])}>
            <Clock3 className="size-4" />
            <AlertTitle>{status.label}</AlertTitle>
            <AlertDescription>{status.description}</AlertDescription>
          </Alert>
        ) : null}

        {application && canSubmit ? (
          <Alert className={cn("rounded-2xl", statusToneClass[status.tone])}>
            <FileCheck2 className="size-4" />
            <AlertTitle>{status.label}</AlertTitle>
            <AlertDescription>{status.description}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" /> Manual Details
              </CardTitle>
              <CardDescription>
                {canSubmit
                  ? "Submit one KYC ticket at a time. If admin rejects it, you can send a new application."
                  : "Submission is locked while your current KYC ticket is being processed."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submitKyc}>
                <div className="space-y-2">
                  <Label>Name as per PAN/Aadhaar</Label>
                  <Input
                    value={form.name}
                    disabled={!canSubmit || submit.isPending}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN number</Label>
                  <Input
                    value={form.panNumber}
                    disabled={!canSubmit || submit.isPending}
                    onChange={(event) => setForm({ ...form, panNumber: event.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aadhaar number</Label>
                  <Input
                    value={form.aadhaarNumber}
                    disabled={!canSubmit || submit.isPending}
                    onChange={(event) => setForm({ ...form, aadhaarNumber: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>PAN card image</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={!canSubmit || submit.isPending}
                    onChange={(event) => setForm({ ...form, panFile: event.target.files?.[0] })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aadhaar card image</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={!canSubmit || submit.isPending}
                    onChange={(event) => setForm({ ...form, aadhaarFile: event.target.files?.[0] })}
                  />
                </div>
                <Button type="submit" disabled={!canSubmit || submit.isPending}>
                  {submit.isPending ? "Submitting..." : canSubmit ? "Submit KYC" : "Submission Locked"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5" /> Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application ? (
                <div className="space-y-4">
                  <Badge className={cn("rounded-full", statusToneClass[status.tone])}>{status.label}</Badge>
                  <p className="text-sm text-muted-foreground">{status.description}</p>
                  <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Name</span>
                        <p className="font-medium">{application.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAN</span>
                        <p className="font-medium">{application.panNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aadhaar</span>
                        <p className="font-medium">{application.aadhaarNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted</span>
                        <p className="font-medium">
                          {new Date(application.submittedAt || application.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(application.checks || {}).map(([key, value]) => (
                      <Badge key={key} variant={value ? "default" : "destructive"}>
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No KYC application submitted yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
