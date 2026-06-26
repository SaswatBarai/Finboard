"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, BriefcaseBusiness, CheckCircle2, PauseCircle, PiggyBank, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AdminShell, AdminSection } from "@/features/layout";
import { StatCard } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiError } from "@/lib/api";
import { investmentApi } from "../../../investments/api/investment-api";

function rupee(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AmcAdminPage() {
  const queryClient = useQueryClient();
  const overview = useQuery({ queryKey: ["amc-admin-overview"], queryFn: investmentApi.adminOverview });
  const orders = overview.data?.holdings || [];
  const summary = overview.data?.summary || {};
  const mutualFundOrders = orders.filter((order) => order.assetType !== "stock");
  const stockOrders = orders.filter((order) => order.assetType === "stock").slice(0, 12);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => investmentApi.updateOrderStatus(id, status),
    onSuccess() {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["amc-admin-overview"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  return (
    <AdminShell title="AMC Dashboard" logo="M">
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader>
            <CardDescription>Asset Management Company</CardDescription>
            <CardTitle className="text-2xl">Scheme operations, SIP book, and investor order control</CardTitle>
            <p className="text-sm text-muted-foreground">
              Simulates AMC responsibilities: NAV operations, fund AUM, SIP collection, order approval, and collection-account visibility.
            </p>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={BriefcaseBusiness} label="Total AUM" value={rupee(summary.totalAum)} />
          <StatCard icon={PiggyBank} label="Monthly SIP Book" value={rupee(summary.sipBook)} />
          <StatCard icon={UsersRound} label="Investors" value={summary.totalInvestors || 0} />
          <StatCard icon={PauseCircle} label="Pending Orders" value={summary.pendingOrders || 0} tone="warning" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardContent className="pt-6">
              <AdminSection
                title="Mutual fund and SIP orders"
                description="AMC order book"
                action={<BarChart3 className="size-5 text-primary" />}
              >
              <ScrollArea className="h-[min(70vh,720px)] pr-4">
                <div className="space-y-4">
                  {mutualFundOrders.map((order) => (
                    <Card key={order._id} size="sm">
                      <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                          <strong className="block">{order.name}</strong>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span>{order.symbol}</span>
                            <Badge variant="secondary">{order.assetType}</Badge>
                            <Badge variant="outline">{order.orderStatus}</Badge>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <span className="text-muted-foreground">Investor</span>
                          <strong className="block">{order.investor?.name || "Investor"}</strong>
                          <p className="text-muted-foreground">{order.investor?.email}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <span className="text-muted-foreground">Folio</span>
                          <strong className="block">{order.folioNumber || "Pending"}</strong>
                          <p className="text-muted-foreground">{order.amcAccount?.accountHolder}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <strong className="block">{rupee(order.totalAmount)}</strong>
                          <p className="text-muted-foreground">{order.quantity?.toFixed?.(3) || order.quantity} units</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                              updateStatus.mutate({
                                id: order._id,
                                status: order.assetType === "sip" ? "sip_active" : "successful"
                              })
                            }
                          >
                            <CheckCircle2 className="size-4" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: order._id, status: "rejected" })}
                          >
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!mutualFundOrders.length ? (
                    <p className="text-sm text-muted-foreground">No mutual fund orders yet.</p>
                  ) : null}
                </div>
              </ScrollArea>
              </AdminSection>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <AdminSection title="Investor stock activity" description="RTA visibility">
              <div className="space-y-3">
                {stockOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <strong className="block text-sm">{order.symbol}</strong>
                      <span className="truncate text-sm text-muted-foreground">{order.investor?.name || "Investor"}</span>
                    </div>
                    <Badge variant="secondary">{rupee(order.totalAmount)}</Badge>
                  </div>
                ))}
                {!stockOrders.length ? <p className="text-sm text-muted-foreground">No stock activity yet.</p> : null}
              </div>
              </AdminSection>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
