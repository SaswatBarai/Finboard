"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/features/auth/context/auth-context";
import { kycApi } from "@/features/kyc/api/kyc-api";
import { AuditTrail } from "../components/audit-trail";

function formatApplicationLabel(application) {
  const shortId = String(application._id).slice(-8);
  return `${application.name} · ${application.status} · …${shortId}`;
}

export default function AdminAuditScreen() {
  const searchParams = useSearchParams();
  const initialKycId = searchParams.get("kycId") || "";
  const [selectedKycId, setSelectedKycId] = useState(initialKycId);
  const { token, ready } = useAuth();

  const applications = useQuery({
    queryKey: ["admin-kyc-list"],
    queryFn: kycApi.adminList,
    enabled: ready && Boolean(token)
  });

  useEffect(() => {
    if (initialKycId) {
      setSelectedKycId(initialKycId);
    }
  }, [initialKycId]);

  useEffect(() => {
    if (!selectedKycId && applications.data?.length) {
      setSelectedKycId(applications.data[0]._id);
    }
  }, [applications.data, selectedKycId]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader>
            <CardDescription>Compliance history</CardDescription>
            <CardTitle className="text-2xl">KYC audit trail lookup</CardTitle>
            <p className="text-sm text-muted-foreground">
              Audit is recorded when KYC is submitted, approved, or rejected. Select an application to view its
              append-only event history.
            </p>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="kyc-application">KYC application</Label>
              <Select value={selectedKycId} onValueChange={setSelectedKycId}>
                <SelectTrigger id="kyc-application" className="h-11">
                  <SelectValue placeholder="Select a KYC application" />
                </SelectTrigger>
                <SelectContent>
                  {(applications.data || []).map((application) => (
                    <SelectItem key={application._id} value={application._id}>
                      {formatApplicationLabel(application)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {applications.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading KYC applications...</p>
            ) : null}

            {!applications.isLoading && !(applications.data || []).length ? (
              <p className="text-sm text-muted-foreground">No KYC applications available for audit lookup.</p>
            ) : null}

            {selectedKycId ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/kyc/${selectedKycId}`}>Open KYC review</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {selectedKycId ? (
          <AuditTrail resourceType="kyc" resourceId={selectedKycId} title="KYC Audit Trail" />
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Select a KYC application to view its audit trail.
            </CardContent>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
