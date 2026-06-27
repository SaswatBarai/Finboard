"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminShell, AdminSection } from "@/features/layout";
import { StatCard } from "@/features/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bankingApi } from "../../../banking/api/banking-api";
import { getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

function rupee(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankingAdminPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["bank-admin-users"], queryFn: bankingApi.adminUsers });
  const transactions = useQuery({ queryKey: ["bank-admin-transactions"], queryFn: bankingApi.adminTransactions });

  const freeze = useMutation({
    mutationFn: ({ id, frozen }) => bankingApi.freeze(id, frozen),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bank-admin-users"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const totalMoney = (users.data || []).reduce((sum, account) => sum + Number(account.balance), 0);
  const frozenCount = (users.data || []).filter((account) => account.status === "FROZEN").length;

  return (
    <AdminShell title="Accounts, balances and controls" description="Admin Core Banking View">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total bank money" value={rupee(totalMoney)} description="Across seeded accounts" />
          <StatCard label="Accounts" value={users.data?.length || 0} description="Admin and customers" />
          <StatCard label="Transactions" value={transactions.data?.length || 0} description="Latest 200 records" />
          <StatCard label="Frozen" value={frozenCount} description="Blocked accounts" tone="danger" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <AdminSection title="All Accounts">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>IFSC</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data || []).map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.holderName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell>{account.ifsc}</TableCell>
                    <TableCell className="font-semibold">{rupee(account.balance)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          account.status === "FROZEN" &&
                            "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        )}
                      >
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant={account.status === "FROZEN" ? "default" : "outline"}
                        onClick={() => freeze.mutate({ id: account.id, frozen: account.status !== "FROZEN" })}
                      >
                        {account.status === "FROZEN" ? "Unfreeze" : "Freeze"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </AdminSection>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
