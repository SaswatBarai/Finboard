"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { documentsApi } from "../api/documents-api";

const apiBase = process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
  : "";

function documentUrl(path) {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  return `${apiBase}${path}`;
}

function statusTone(status) {
  if (status === "approved") return "border-[var(--positive-deep)]/20 bg-[var(--primary-pale)] text-[var(--positive-deep)]";
  if (["rejected", "failed"].includes(status)) return "border-[var(--negative)]/20 bg-[var(--negative)]/10 text-[var(--negative)]";
  return "border-[var(--warning)]/30 bg-[var(--warning)]/15 text-[var(--warning-content,#4a3b1c)]";
}

export default function DocumentsScreen() {
  const application = useQuery({
    queryKey: ["documents-kyc"],
    queryFn: documentsApi.kycApplication
  });

  const docs = application.data?.documents || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Identity Vault</p>
          <h1 className="display-sm">Your documents</h1>
          <p className="body-lg max-w-2xl">
            PAN and Aadhaar uploads submitted during KYC. Documents are served from the platform upload store for demo review.
          </p>
        </div>

        {!application.data ? (
          <Card className="finboard-card-sage">
            <CardHeader>
              <CardTitle>No KYC submission yet</CardTitle>
              <CardDescription>Complete identity verification to store and review your uploaded documents here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/kyc">
                  <ShieldCheck className="size-4" />
                  Start KYC
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className="finboard-card-green h-fit">
              <CardHeader>
                <CardTitle className="text-base">Application status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Badge variant="outline" className={statusTone(application.data.status)}>
                  {application.data.status}
                </Badge>
                <p className="text-muted-foreground">
                  Submitted {new Date(application.data.submittedAt || application.data.createdAt).toLocaleString("en-IN")}
                </p>
                <p>
                  <span className="text-muted-foreground">PAN:</span> {application.data.panNumber}
                </p>
                <p>
                  <span className="text-muted-foreground">Aadhaar:</span> {application.data.aadhaarNumber}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {docs.length ? (
                docs.map((document) => (
                  <Card key={document.type} className="finboard-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardDescription>Uploaded file</CardDescription>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="size-4" />
                          {document.type?.toUpperCase()}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="rounded-full">
                        {document.extractionSource || "stored"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {document.url && /\.(png|jpe?g|webp)$/i.test(document.url) ? (
                        <img
                          src={documentUrl(document.url)}
                          alt={`${document.type} document`}
                          className="max-h-56 w-full rounded-2xl border border-foreground/10 object-contain bg-secondary"
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-secondary text-sm text-muted-foreground">
                          Document preview unavailable
                        </div>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a href={documentUrl(document.url)} target="_blank" rel="noreferrer">
                          Open original
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="finboard-card-sage sm:col-span-2">
                  <CardContent className="py-8 text-sm text-muted-foreground">
                    No document files were attached to this application.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
