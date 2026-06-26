"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Bookmark, CalendarDays, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api, getApiError } from "@/lib/api";
import { bankingApi } from "../../banking/api/banking-api";
import { investmentApi } from "../api/investment-api";
import { findInstrument } from "../data/market-data";
import { cn } from "@/lib/utils";

function rupee(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateChart(trend) {
  const points = trend === "down"
    ? [76, 66, 70, 58, 62, 44, 49, 39, 42, 28, 34, 31, 25, 33, 22, 30]
    : [34, 42, 39, 51, 48, 62, 57, 68, 65, 76, 72, 82, 78, 88, 84, 92];

  return points.map((y, index) => `${index * 44},${100 - y}`).join(" ");
}

const chartRanges = ["1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "All"];
const infoTabs = ["Overview", "Technicals", "News", "Events", "F&O"];

export default function StockDetailPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const item = findInstrument(symbol);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [orderMode, setOrderMode] = useState("lumpsum");
  const [sipAmount, setSipAmount] = useState(1000);
  const [sipDate, setSipDate] = useState(5);

  const profileQuery = useQuery({
    queryKey: ["profile-me"],
    queryFn: () => api.get("/profile/me").then((response) => response.data.profile)
  });
  const bankQuery = useQuery({ queryKey: ["banking-summary"], queryFn: bankingApi.summary, refetchInterval: 15000 });
  const portfolioQuery = useQuery({ queryKey: ["portfolio"], queryFn: investmentApi.portfolio });

  const buy = useMutation({
    mutationFn: (payload) => (payload.monthlyAmount ? investmentApi.createSip(payload) : investmentApi.buy(payload)),
    onSuccess() {
      toast.success(`${item.symbol} added to portfolio`);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-app-notifications"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const account = bankQuery.data?.account;
  const kycApproved = profileQuery.data?.kycStatus === "approved";
  const isFund = item?.type === "mutual_fund";
  const owned = useMemo(
    () => (portfolioQuery.data || []).filter((holding) => holding.symbol === item?.symbol).reduce((sum, holding) => sum + Number(holding.quantity || 0), 0),
    [portfolioQuery.data, item?.symbol]
  );

  useEffect(() => {
    if (!item) {
      router.replace("/dashboard");
    }
  }, [item, router]);

  if (!item) {
    return null;
  }

  const amount = isFund && orderMode === "sip" ? Number(sipAmount || 0) : item.price * Number(quantity || 0);
  const canBuy = Boolean(account && kycApproved && (orderMode === "sip" ? Number(sipAmount) >= 100 : quantity > 0) && !buy.isPending);

  function submitOrder(event) {
    event.preventDefault();
    if (!kycApproved) {
      toast.error("Complete KYC approval before buying.");
      return;
    }
    if (!account) {
      toast.error("Complete bank verification before buying.");
      return;
    }
    if (isFund && orderMode === "sip") {
      buy.mutate({
        symbol: item.symbol,
        name: item.name,
        nav: item.nav,
        monthlyAmount: Number(sipAmount),
        sipDate: Number(sipDate),
        amcAccount: item.account,
        metadata: {
          category: item.sector,
          risk: item.risk,
          fundManager: item.fundManager
        }
      });
      return;
    }

    buy.mutate({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      quantity: Number(quantity),
      assetType: isFund ? "mutual_fund" : "stock",
      amcAccount: item.account,
      metadata: isFund
        ? { category: item.sector, risk: item.risk, fundManager: item.fundManager, aum: item.aum }
        : { sector: item.sector, marketCap: item.marketCap, pe: item.pe, dividendYield: item.dividendYield }
    });
  }

  const facts = isFund
    ? [
        ["AUM", item.aum],
        ["Risk", item.risk],
        ["Expense ratio", `${item.expenseRatio}%`],
        ["Fund manager", item.fundManager],
        ["1Y return", `${item.oneYear}%`],
        ["5Y return", `${item.fiveYear}%`]
      ]
    : [
        ["Market cap", item.marketCap],
        ["Sector", item.sector],
        ["PE ratio", item.pe],
        ["Dividend yield", `${item.dividendYield}%`],
        ["Volume", item.volume],
        ["Treasury account", item.account?.accountNumber]
      ];

  return (
    <AppLayout>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                {item.symbol}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {item.symbol} / {item.exchange} / {item.sector}
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{item.name}</h1>
                <p className="mt-1 text-lg font-semibold">
                  {rupee(item.price)}{" "}
                  <span className={cn("text-sm font-medium", item.trend === "up" ? "text-emerald-600" : "text-red-600")}>
                    {item.change}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="icon">
                <LinkIcon />
              </Button>
              <Button type="button" variant="outline" size="icon">
                <Bell />
              </Button>
              <Button type="button" variant="outline" size="icon">
                <Bookmark />
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <svg className="h-40 w-full" viewBox="0 0 660 120" preserveAspectRatio="none">
                <polyline
                  className={cn("fill-none stroke-2", item.trend === "up" ? "stroke-emerald-500" : "stroke-red-500")}
                  points={generateChart(item.trend)}
                />
              </svg>
            </CardContent>
          </Card>

          <Tabs defaultValue="1D">
            <TabsList variant="line" className="w-full justify-start overflow-x-auto">
              {chartRanges.map((range) => (
                <TabsTrigger key={range} value={range}>
                  {range}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Card className="transition-colors hover:bg-muted/30">
            <Link
              className="flex items-center gap-4 px-6 py-4"
              href={isFund ? `/stocks/${item.symbol}` : "/dashboard?market=mutual-funds"}
            >
              <CalendarDays className="size-6 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{isFund ? "SIP Available" : "Create Stock SIP"}</p>
                <p className="text-sm text-muted-foreground">
                  {isFund ? "Create a monthly auto-debit schedule with folio tracking" : "Automate monthly investments in this instrument"}
                </p>
              </div>
              <Badge variant="secondary">{isFund ? "AMC" : "Open"}</Badge>
            </Link>
          </Card>

          <Tabs defaultValue="Overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              {infoTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="Overview" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                    <span>
                      Today&apos;s low <strong className="text-foreground">{rupee(item.low)}</strong>
                    </span>
                    <span>
                      Today&apos;s high <strong className="text-foreground">{rupee(item.high)}</strong>
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary"
                      style={{ width: `${((item.price - item.low) / (item.high - item.low || 1)) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map(([label, value]) => (
                  <Card key={label} size="sm">
                    <CardContent className="space-y-1 pt-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold">{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {infoTabs.slice(1).map((tab) => (
              <TabsContent key={tab} value={tab} className="pt-4">
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {tab} data is not available in this demo.
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <aside>
          <Card className="sticky top-6">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{item.symbol}</CardTitle>
                <Badge variant="outline">{item.exchange}</Badge>
              </div>
              <CardDescription>
                {isFund ? `${rupee(item.nav)} NAV` : rupee(item.price)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ToggleGroup
                className="w-full"
                spacing={0}
                value={[orderMode]}
                variant="outline"
                onValueChange={(values) => {
                  if (values[0]) {
                    setOrderMode(values[0]);
                  }
                }}
              >
                <ToggleGroupItem className="flex-1" value="lumpsum">
                  {isFund ? "LUMPSUM" : "BUY"}
                </ToggleGroupItem>
                <ToggleGroupItem className="flex-1" disabled={!isFund} value="sip">
                  {isFund ? "SIP" : "SELL"}
                </ToggleGroupItem>
              </ToggleGroup>

              <form className="space-y-4" onSubmit={submitOrder}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{isFund ? "Folio" : "Delivery"}</Badge>
                  <Badge variant="secondary">{isFund ? item.risk : "Intraday"}</Badge>
                  <Badge variant="secondary">{isFund ? item.sector : "MTF 3.89x"}</Badge>
                </div>

                {isFund && orderMode === "sip" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sip-amount">Monthly SIP</Label>
                      <Input
                        id="sip-amount"
                        min="100"
                        step="100"
                        type="number"
                        value={sipAmount}
                        onChange={(event) => setSipAmount(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sip-date">SIP Date</Label>
                      <Input
                        id="sip-date"
                        max="28"
                        min="1"
                        type="number"
                        value={sipDate}
                        onChange={(event) => setSipDate(event.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{isFund ? "Units" : "Qty"}</Label>
                    <Input
                      id="quantity"
                      min={isFund ? "0.001" : "1"}
                      step={isFund ? "0.001" : "1"}
                      type="number"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="price-limit">{isFund ? "NAV" : "Price Limit"}</Label>
                  <Input id="price-limit" readOnly value={item.price.toFixed(2)} />
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="text-muted-foreground">Money routes to</p>
                  <p className="font-semibold">{item.account?.accountHolder}</p>
                  <p className="text-muted-foreground">
                    {item.account?.bankName} / {item.account?.accountNumber} / {item.account?.ifsc}
                  </p>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Balance: {account ? rupee(account.balance) : "Not linked"}</p>
                  <p>Approx req: {rupee(amount)}</p>
                  <p>Owned: {owned}</p>
                </div>

                {!kycApproved ? (
                  <p className="text-sm text-amber-600">KYC approval required before buying.</p>
                ) : null}
                {!account ? (
                  <p className="text-sm text-amber-600">Verify bank account before buying.</p>
                ) : null}

                <Button className="w-full" disabled={!canBuy} type="submit">
                  {buy.isPending ? "Processing..." : isFund && orderMode === "sip" ? "Start SIP" : isFund ? "Invest" : "Buy"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
}
