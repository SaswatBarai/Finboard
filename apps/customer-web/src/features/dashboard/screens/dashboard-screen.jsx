"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck2,
  Landmark,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, getApiError } from "@/lib/api";
import { bankingApi } from "../../banking/api/banking-api";
import { investmentApi } from "../../investments/api/investment-api";
import { tabs } from "../../investments/data/market-data";
import { cn } from "@/lib/utils";

function rupee(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const portfolioValue = holdings.reduce((sum, holding) => sum + Number(holding.currentPrice || 0) * Number(holding.quantity || 0), 0);
  const investedTotal = holdings.reduce((sum, holding) => sum + Number(holding.totalAmount || 0), 0);

  const pendingCards = useMemo(
    () =>
      [
        !account
          ? { title: "Complete bank details", value: "Required", detail: "Connect one seeded account", icon: Landmark }
          : null,
        !kycVerified
          ? {
              title: "Complete KYC",
              value: kycInProgress ? "In Progress" : "Pending",
              detail: kycInProgress ? "Waiting for admin approval" : "Required before investing",
              icon: ShieldCheck
            }
          : null,
        {
          title: "Portfolio value",
          value: rupee(portfolioValue),
          detail: holdings.length ? `${holdings.length} holdings` : "Starts after your first investment",
          icon: TrendingUp
        },
        {
          title: "Documents",
          value: kycVerified ? "Verified" : "Upload required",
          detail: "PAN and Aadhaar",
          icon: FileCheck2
        }
      ].filter(Boolean),
    [account, kycVerified, kycInProgress, holdings.length, portfolioValue]
  );

  const verifyBank = useMutation({
    mutationFn: bankingApi.verifyBank,
    onSuccess(data) {
      toast.success(data.message || "Bank account verified. Rs. 2 debited and refund will arrive soon.");
      queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-bank-notifications"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-border bg-card p-6">
          <div>
            <p className="text-sm text-primary">{market.eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight">{market.heading}</h1>
            <p className="text-muted-foreground">{market.subheading}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/banking">Banking</Link>
            </Button>
            <Button asChild>
              <Link href="/kyc">KYC</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {pendingCards.map((card) => (
            <StatCard key={card.title} icon={card.icon} label={card.title} value={card.value} description={card.detail} />
          ))}
        </section>

        {!account ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-5" /> Complete Bank Details
              </CardTitle>
              <CardDescription>
                Enter a seeded dummy account. If it exists, the backend verifies it, debits Rs. 2, and refunds it automatically after a short demo delay.
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
                <div className="space-y-2">
                  <Label>Account holder name</Label>
                  <Input value={bankForm.accountHolderName} onChange={(event) => setBankForm({ ...bankForm, accountHolderName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Account number</Label>
                  <Input value={bankForm.accountNumber} onChange={(event) => setBankForm({ ...bankForm, accountNumber: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC</Label>
                  <Input value={bankForm.ifsc} onChange={(event) => setBankForm({ ...bankForm, ifsc: event.target.value.toUpperCase() })} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={verifyBank.isPending} className="w-full">
                    Verify bank and debit Rs. 2
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardDescription>{market.label}</CardDescription>
                  <CardTitle>{market.title || "Featured picks"}</CardTitle>
                </div>
                <Badge variant="secondary">Mock Market</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((item) => (
                    <Card key={item.name} className="border-border/80">
                      <CardContent className="space-y-2 pt-4">
                        <Badge variant="outline">{item.symbol}</Badge>
                        <Link href={`/stocks/${item.symbol}`} className="block font-semibold hover:text-primary">
                          {item.name}
                        </Link>
                        <p className="text-sm">{item.type === "mutual_fund" ? `${rupee(item.nav)} NAV` : rupee(item.price)}</p>
                        <p className={cn("text-sm", item.trend === "down" ? "text-down" : "text-up")}>{item.change}</p>
                        <Button variant="link" className="h-auto p-0" asChild>
                          <Link href={`/stocks/${item.symbol}`}>{market.button}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Prev</Button>
                  {Array.from({ length: pageCount }, (_, index) => (
                    <Button key={index + 1} variant={page === index + 1 ? "default" : "outline"} size="sm" onClick={() => setPage(index + 1)}>
                      {index + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Market activity</CardDescription>
                <CardTitle>{marketKey === "mutual-funds" ? "SIP ideas" : "Top movers today"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price/Plan</TableHead>
                      <TableHead>Move/Risk</TableHead>
                      <TableHead>Volume/Return</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {market.movers.map((row) => (
                      <TableRow key={row[0]}>
                        <TableCell className="font-medium">{row[0]}</TableCell>
                        <TableCell>{row[1]}</TableCell>
                        <TableCell className={String(row[2]).startsWith("-") ? "text-down" : "text-up"}>{row[2]}</TableCell>
                        <TableCell>{row[3]}</TableCell>
                        <TableCell>Live</TableCell>
                        <TableCell>
                          <Button variant="link" className="h-auto p-0" asChild>
                            <Link href={`/stocks/${row[4] || market.cards[0]?.symbol || "RELI"}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>Your investments</CardDescription>
                <CardTitle>{rupee(portfolioValue)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between"><span>1D returns</span><strong className="text-down">-0.41%</strong></div>
                <div className="flex justify-between"><span>Total returns</span><strong className="text-down">-16.26%</strong></div>
                <div className="flex justify-between"><span>Invested</span><strong>{rupee(investedTotal)}</strong></div>
                <div className="flex justify-between"><span>Holdings</span><strong>{holdings.length}</strong></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Products & Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {market.products.map(([name, tag, Icon]) => (
                  <Link key={name} href={name.includes("SIP") ? "/dashboard?market=mutual-funds" : "/dashboard"} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent">
                    <Icon className="size-5 text-primary" />
                    <div>
                      <strong className="text-sm">{name}</strong>
                      <p className="text-xs text-muted-foreground">{tag}</p>
                    </div>
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
