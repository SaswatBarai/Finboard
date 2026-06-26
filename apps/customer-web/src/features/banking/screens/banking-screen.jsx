"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/features/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiError } from "@/lib/api";
import { bankingApi } from "../api/banking-api";

function rupee(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankingPage() {
  const queryClient = useQueryClient();
  const [transferForm, setTransferForm] = useState({ accountNumber: "", ifsc: "DEMO0000001", amount: "", remarks: "" });
  const [receiver, setReceiver] = useState(null);
  const [range, setRange] = useState("all");

  const summary = useQuery({ queryKey: ["banking-summary"], queryFn: bankingApi.summary, refetchInterval: 15000 });
  const transactions = useQuery({ queryKey: ["bank-transactions", range], queryFn: () => bankingApi.transactions(range), refetchInterval: 15000 });
  const account = summary.data?.account;

  const refreshBank = () => {
    queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
    queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["navbar-bank-notifications"] });
  };

  const lookupReceiver = useMutation({
    mutationFn: bankingApi.lookup,
    onSuccess(data) {
      setReceiver(data);
      setTransferForm((current) => ({ ...current, ifsc: data.ifsc }));
      toast.success(`Receiver found: ${data.holderName}`);
    },
    onError(error) {
      setReceiver(null);
      toast.error(getApiError(error));
    }
  });

  const transferMutation = useMutation({
    mutationFn: bankingApi.transfer,
    onSuccess() {
      toast.success("Money sent successfully");
      setTransferForm({ accountNumber: "", ifsc: "DEMO0000001", amount: "", remarks: "" });
      setReceiver(null);
      refreshBank();
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-primary">Banking Section</p>
            <h1 className="text-3xl font-bold tracking-tight">Balance, transfers and history</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/profile?section=Bank%20Details">Manage Bank Accounts</Link>
          </Button>
        </div>

        {!account ? (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <CreditCard className="size-10 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">No verified bank account</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                Complete bank details on the dashboard or profile page first. After verification, balance and transfers will appear here.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard">Complete Bank Details</Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-gradient-to-br from-primary/10 to-card">
                <CardHeader>
                  <CardDescription className="flex items-center gap-2">
                    <CreditCard className="size-4" /> Verified Account
                  </CardDescription>
                  <CardTitle className="text-3xl">{rupee(account.balance)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {account.holderName} / {account.bankName || "Finboard Demo Bank"} / {account.accountNumber} / {account.ifsc}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Send className="size-5" /> Send Money
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      transferMutation.mutate(transferForm);
                    }}
                  >
                    <div className="flex gap-2">
                      <Input placeholder="Friend account number" value={transferForm.accountNumber} onChange={(event) => setTransferForm({ ...transferForm, accountNumber: event.target.value })} />
                      <Button type="button" variant="secondary" onClick={() => lookupReceiver.mutate(transferForm.accountNumber)} disabled={!transferForm.accountNumber || lookupReceiver.isPending}>
                        Find
                      </Button>
                    </div>
                    {receiver ? (
                      <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
                        Sending to {receiver.holderName} / {receiver.bankName || "Finboard Demo Bank"} / {receiver.ifsc}
                      </p>
                    ) : null}
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" min="1" value={transferForm.amount} onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Remarks</Label>
                      <Input value={transferForm.remarks} onChange={(event) => setTransferForm({ ...transferForm, remarks: event.target.value })} />
                    </div>
                    <Button type="submit" disabled={transferMutation.isPending}>Send money</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(transactions.data || []).map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.createdAt).toLocaleString("en-IN")}</TableCell>
                        <TableCell className={txn.type === "CREDIT" ? "text-up" : "text-down"}>{txn.type}</TableCell>
                        <TableCell>{rupee(txn.amount)}</TableCell>
                        <TableCell>{txn.type === "CREDIT" ? txn.senderAccountNumber || "-" : txn.receiverAccountNumber || "-"}</TableCell>
                        <TableCell>{txn.status}</TableCell>
                        <TableCell>{txn.remarks || txn.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!transactions.data?.length ? <p className="py-4 text-sm text-muted-foreground">No transactions yet.</p> : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
