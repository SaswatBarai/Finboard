"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronRight,
  FileCheck2,
  Landmark,
  LogOut,
  Search,
  Settings,
  Shield,
  UserRound,
  WalletCards,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { bankingApi } from "../../banking/api/banking-api";
import { allInstruments } from "../../investments/data/market-data";
import { notificationApi } from "../../notifications/api/notification-api";
import { useAuth } from "../../auth/context/auth-context";

const navLinks = [
  { href: "/dashboard?market=stocks", label: "Stocks", market: "stocks" },
  { href: "/dashboard?market=fo", label: "F&O", market: "fo" },
  { href: "/dashboard?market=mutual-funds", label: "Mutual Funds", market: "mutual-funds" },
  { href: "/banking", label: "Banking", market: null }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const bankNotifications = useQuery({
    queryKey: ["navbar-bank-notifications"],
    queryFn: bankingApi.notifications,
    enabled: Boolean(user),
    refetchInterval: 15000
  });
  const appNotifications = useQuery({
    queryKey: ["navbar-app-notifications"],
    queryFn: notificationApi.app,
    enabled: Boolean(user),
    refetchInterval: 15000
  });

  const dismissNotification = useMutation({
    mutationFn: (item) => (item.source === "banking" ? bankingApi.dismissNotification(item.id) : notificationApi.dismiss(item.id)),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["navbar-bank-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-app-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-app-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["bank-notifications"] });
    }
  });

  const markAppNotificationsRead = useMutation({
    mutationFn: async (items) => {
      const unread = items.filter((item) => item.source === "app" && !item.read);
      await Promise.all(unread.map((item) => notificationApi.markRead(item.id)));
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["navbar-app-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-app-unread-count"] });
    }
  });

  const mergedNotifications = [
    ...(appNotifications.data || []).map((item) => ({ ...item, id: item._id || item.id, source: "app" })),
    ...(bankNotifications.data || []).map((item) => ({ ...item, source: "banking" }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = mergedNotifications.filter((item) => !item.read).length || 0;
  const currentMarket = searchParams.get("market") || "stocks";

  const searchResults = search.trim()
    ? allInstruments
        .filter((item) => `${item.name} ${item.symbol}`.toLowerCase().includes(search.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  function handleLogout() {
    logout();
    router.push("/signin");
  }

  function openProfile(section) {
    router.push(section ? `/profile?section=${encodeURIComponent(section)}` : "/profile");
  }

  function openInstrument(symbol) {
    setSearch("");
    setSearchOpen(false);
    router.push(`/stocks/${symbol}`);
  }

  function isActive(link) {
    if (link.market) {
      return pathname === "/dashboard" && currentMarket === link.market;
    }
    return pathname === link.href;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-foreground/10 bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-9 rounded-full bg-primary" />
          <span className="hidden sm:inline">Finboard</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant={isActive(link) ? "secondary" : "ghost"} size="sm" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex-1" />

        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative hidden max-w-xs flex-1 sm:block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search investments..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
            </div>
          </PopoverTrigger>
          {searchResults.length ? (
            <PopoverContent className="w-80 p-0" align="end">
              <ScrollArea className="max-h-72">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent"
                    onClick={() => openInstrument(item.symbol)}
                  >
                    <span className="text-xs font-medium text-primary">{item.symbol}</span>
                    <strong className="text-sm">{item.name}</strong>
                    <em className="text-xs text-muted-foreground not-italic">{item.exchange}</em>
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          ) : null}
        </Popover>

        <Popover
          onOpenChange={(open) => {
            if (open && mergedNotifications.length) {
              markAppNotificationsRead.mutate(mergedNotifications);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              {unreadCount ? (
                <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]">
                  {Math.min(unreadCount, 9)}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <strong className="text-sm">Notifications</strong>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/banking">View banking</Link>
              </Button>
            </div>
            <ScrollArea className="max-h-80">
              {mergedNotifications.slice(0, 10).map((item) => (
                <div key={`${item.source}-${item.id}`} className="flex items-start justify-between gap-2 border-b border-border px-4 py-3 last:border-0">
                  <div>
                    <strong className="text-sm">{item.title}</strong>
                    <p className="text-xs text-muted-foreground">{item.message}</p>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => dismissNotification.mutate(item)} aria-label="Remove notification">
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              {!mergedNotifications.length ? (
                <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
              ) : null}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open profile menu">
              <Avatar className="size-8">
                <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || <UserRound className="size-4" />}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name || "Investor"}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openProfile()}>
              <Settings className="size-4" /> Profile settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openProfile("Basic Details")}>
              <UserRound className="size-4" /> Profile details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openProfile("Bank Details")}>
              <Landmark className="size-4" /> Bank details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/documents")}>
              <FileCheck2 className="size-4" /> Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/kyc")}>
              <FileCheck2 className="size-4" /> KYC verification
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/banking")}>
              <WalletCards className="size-4" /> Banking
            </DropdownMenuItem>
            {["admin", "rta_admin"].includes(user?.role) ? (
              <DropdownMenuItem onClick={() => router.push("/admin/kyc")}>
                <Shield className="size-4" /> RTA review
              </DropdownMenuItem>
            ) : null}
            {["admin", "amc_admin"].includes(user?.role) ? (
              <DropdownMenuItem onClick={() => router.push("/admin/amc")}>
                <Shield className="size-4" /> AMC dashboard
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
