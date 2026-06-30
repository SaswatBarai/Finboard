"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ChevronRight,
  FileCheck2,
  Landmark,
  ShieldCheck,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/features/layout";
import { StatCard } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiError } from "@/lib/api";
import { bankingApi } from "../../banking/api/banking-api";
import { investmentApi } from "../../investments/api/investment-api";
import { indices, tabs } from "../../investments/data/market-data";
import InstrumentCard from "../components/instrument-card";
import MarketIndexStrip from "../components/market-index-strip";
import SectorBreadthCard from "../components/sector-breadth-card";
import { cn } from "@/lib/utils";

function rupee(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [bankForm, setBankForm] = useState({ accountHolderName: "", accountNumber: "", ifsc: "DEMO0000001" });
  const [page, setPage] = useState(1);
  const marketKey = searchParams.get("market") || "stocks";
  const market = tabs[marketKey] || tabs.stocks;
  const pageSize = marketKey === "mutual-funds" ? 6 : 12;
  const pageCount = Math.max(1, Math.ceil(market.cards.length / pageSize));
  const visibleCards = market.cards.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [marketKey]);

  const profileQuery = useQuery({
    queryKey: ["profile-me"],
    queryFn: () => api.get("/profile/me").then((response) => response.data.profile)
  });
  const bankQuery = useQuery({
    queryKey: ["banking-summary"],
    queryFn: bankingApi.summary,
    refetchInterval: 15000
  });
  const portfolioQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: investmentApi.portfolio
  });

  const account = bankQuery.data?.account;
  const profile = profileQuery.data;
  const kycVerified = profile?.kycStatus === "approved";
  const kycInProgress = profile?.kycStatus === "pending_review";
  const holdings = portfolioQuery.data || [];
  const portfolioValue = holdings.reduce(
    (sum, holding) => sum + Number(holding.currentPrice || 0) * Number(holding.quantity || 0),
    0
  );
  const investedTotal = holdings.reduce((sum, holding) => sum + Number(holding.totalAmount || 0), 0);
  const pnl = portfolioValue - investedTotal;
  const pnlPct = investedTotal ? ((pnl / investedTotal) * 100).toFixed(2) : "0.00";

  const pendingCards = useMemo(
    () =>
      [
        !account
          ? {
              title: "Complete bank details",
              value: "Required",
              detail: "Connect one seeded account",
              icon: Landmark,
              tone: "warning"
            }
          : null,
        !kycVerified
          ? {
              title: "Complete KYC",
              value: kycInProgress ? "In Progress" : "Pending",
              detail: kycInProgress ? "Waiting for admin approval" : "Required before investing",
              icon: ShieldCheck,
              tone: "warning"
            }
          : null,
        {
          title: "Portfolio value",
          value: rupee(portfolioValue),
          detail: holdings.length ? `${holdings.length} holdings` : "Starts after your first investment",
          icon: TrendingUp,
          tone: holdings.length ? "success" : undefined
        },
        {
          title: "Documents",
          value: kycVerified ? "Verified" : "Upload required",
          detail: "PAN and Aadhaar",
          icon: FileCheck2,
          tone: kycVerified ? "success" : undefined
        }
      ].filter(Boolean),
    [account, kycVerified, kycInProgress, holdings.length, portfolioValue]
  );

  const verifyBank = useMutation({
    mutationFn: bankingApi.verifyBank,
    onSuccess(data) {
      toast.success(data.message || "Bank account verified. ₹2 debited and refund will arrive soon.");
      queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-bank-notifications"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero */}
        <Card className="overflow-hidden border-border/80">
          <CardContent className="flex flex-wrap items-end justify-between gap-4 pt-6">
            <div className="space-y-1">
              <Badge variant="secondary" className="rounded-full text-[11px] font-semibold uppercase tracking-wide">
                {market.eyebrow}
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{market.heading}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{market.subheading}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/banking">
                  <Landmark className="size-4" aria-hidden />
                  Banking
                </Link>
              </Button>
              <Button asChild>
                <Link href="/kyc">
                  <ShieldCheck className="size-4" aria-hidden />
                  KYC
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Index strip — stocks view */}
        {marketKey === "stocks" ? <MarketIndexStrip indices={indices.slice(0, 7)} /> : null}

        {/* Stat cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pendingCards.map((card) => (
            <StatCard
              key={card.title}
              icon={card.icon}
              label={card.title}
              value={card.value}
              description={card.detail}
              tone={card.tone}
            />
          ))}
        </section>

        {/* Bank onboarding */}
        {!account ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark className="size-5 text-primary" aria-hidden />
                Complete bank details
              </CardTitle>
              <CardDescription>
                Enter a seeded dummy account. The backend verifies it, debits ₹2, and refunds automatically after a short demo delay.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  verifyBank.mutate(bankForm);
                }}
              >
                <Field className="gap-1.5">
                  <FieldLabel>Account holder name</FieldLabel>
                  <Input
                    value={bankForm.accountHolderName}
                    onChange={(event) => setBankForm({ ...bankForm, accountHolderName: event.target.value })}
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel>Account number</FieldLabel>
                  <Input
                    value={bankForm.accountNumber}
                    onChange={(event) => setBankForm({ ...bankForm, accountNumber: event.target.value })}
                  />
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel>IFSC</FieldLabel>
                  <Input
                    value={bankForm.ifsc}
                    onChange={(event) => setBankForm({ ...bankForm, ifsc: event.target.value.toUpperCase() })}
                  />
                </Field>
                <div className="flex items-end">
                  <Button type="submit" disabled={verifyBank.isPending} className="w-full">
                    {verifyBank.isPending ? "Verifying…" : "Verify bank & debit ₹2"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* Instrument grid */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>{market.label}</CardDescription>
                  <CardTitle>{market.title || "Featured picks"}</CardTitle>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full">
                  Mock market
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((item) => (
                    <InstrumentCard key={item.symbol} item={item} actionLabel={market.button} />
                  ))}
                </div>

                {pageCount > 1 ? (
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setPage((value) => Math.max(1, value - 1));
                          }}
                          className={cn(page === 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>

                      {Array.from({ length: pageCount }, (_, index) => {
                        const pageNum = index + 1;
                        return (
                          <PaginationItem key={pageNum}>
                            <Button
                              variant={page === pageNum ? "default" : "outline"}
                              size="icon"
                              className="size-9"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            setPage((value) => Math.min(pageCount, value + 1));
                          }}
                          className={cn(page === pageCount && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                ) : null}
              </CardContent>
            </Card>

            {/* Movers table */}
            <Card>
              <CardHeader>
                <CardDescription>Market activity</CardDescription>
                <CardTitle>{marketKey === "mutual-funds" ? "SIP ideas" : "Top movers today"}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price / plan</TableHead>
                      <TableHead>Move / risk</TableHead>
                      <TableHead className="hidden md:table-cell">Volume / return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {market.movers.map((row) => {
                      const isDown = String(row[2]).startsWith("-");
                      return (
                        <TableRow key={row[0]}>
                          <TableCell className="max-w-[180px] font-medium">{row[0]}</TableCell>
                          <TableCell className="tabular-nums">{row[1]}</TableCell>
                          <TableCell>
                            <span className={cn("inline-flex items-center gap-1 font-medium", isDown ? "text-down" : "text-up")}>
                              {isDown ? (
                                <TrendingDown className="size-3.5" aria-hidden />
                              ) : (
                                <TrendingUp className="size-3.5" aria-hidden />
                              )}
                              {row[2]}
                            </span>
                          </TableCell>
                          <TableCell className="hidden tabular-nums md:table-cell">{row[3]}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="rounded-full text-[10px]">
                              Live
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1" asChild>
                              <Link href={`/stocks/${row[4] || market.cards[0]?.symbol || "RELI"}`}>
                                View
                                <ChevronRight className="size-3.5" aria-hidden />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Sector breadth */}
            <SectorBreadthCard
              sectors={market.sectors}
              title={marketKey === "mutual-funds" ? "Fund categories" : "Sector breadth"}
              description={
                marketKey === "mutual-funds"
                  ? "Category performance across the simulated AMC universe"
                  : "Advances vs declines across key NIFTY sectors"
              }
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>Your investments</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{rupee(portfolioValue)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total P&amp;L</span>
                  <strong className={cn("tabular-nums", pnl >= 0 ? "text-up" : "text-down")}>
                    {pnl >= 0 ? "+" : ""}
                    {rupee(pnl)} ({pnlPct}%)
                  </strong>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invested</span>
                  <strong className="tabular-nums">{rupee(investedTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Holdings</span>
                  <strong>{holdings.length}</strong>
                </div>
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href="/dashboard">
                    View portfolio
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Products &amp; tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {market.products.map(([name, tag, Icon]) => (
                  <Link
                    key={name}
                    href={name.includes("SIP") ? "/dashboard?market=mutual-funds" : "/dashboard"}
                    className="group flex items-center gap-3 rounded-xl border border-border/80 p-3 transition-colors hover:border-primary/20 hover:bg-accent/50"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
                      <Icon className="size-4 text-primary" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="text-sm">{name}</strong>
                      <p className="text-xs text-muted-foreground">{tag}</p>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
