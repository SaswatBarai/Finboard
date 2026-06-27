"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  ChevronRight,
  FileCheck2,
  Landmark,
  LineChart,
  LogOut,
  Menu,
  PiggyBank,
  Search,
  Shield,
  UserRound,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { FinboardMark } from "@/components/ui/finboard-logo";
import { ThemeSelector } from "@/components/theme-selector";
import { bankingApi } from "../../banking/api/banking-api";
import { allInstruments } from "../../investments/data/market-data";
import { notificationApi } from "../../notifications/api/notification-api";
import { useAuth } from "../../auth/context/auth-context";
import ProfileMenu from "./profile-menu";

const marketLinks = [
  { href: "/dashboard?market=stocks", label: "Stocks", market: "stocks", icon: LineChart },
  { href: "/dashboard?market=fo", label: "F&O", market: "fo", icon: BarChart3 },
  { href: "/dashboard?market=mutual-funds", label: "Mutual Funds", market: "mutual-funds", icon: PiggyBank }
];

const utilityLinks = [
  { href: "/banking", label: "Banking", icon: Landmark, match: (pathname) => pathname === "/banking" },
  { href: "/kyc", label: "KYC", icon: Shield, match: (pathname) => pathname === "/kyc" }
];

function NavPill({ link, active, onNavigate }) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-all",
        active
          ? "bg-card text-foreground shadow-sm ring-1 ring-border/80"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{link.label}</span>
    </Link>
  );
}

function UtilityLink({ link, active, onNavigate, className }) {
  const Icon = link.icon;

  return (
    <Button variant={active ? "secondary" : "ghost"} size="sm" className={cn("gap-1.5 rounded-full", className)} asChild>
      <Link href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined}>
        <Icon className="size-3.5" aria-hidden />
        {link.label}
      </Link>
    </Button>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
    mutationFn: (item) =>
      item.source === "banking" ? bankingApi.dismissNotification(item.id) : notificationApi.dismiss(item.id),
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

  function openInstrument(symbol) {
    setSearch("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    router.push(`/stocks/${symbol}`);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function isMarketActive(link) {
    return pathname === "/dashboard" && currentMarket === link.market;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md supports-backdrop-filter:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5">
          <span className="transition-transform duration-200 group-hover:scale-[1.04]">
            <FinboardMark size={32} />
          </span>
          <span className="hidden text-[15px] font-black tracking-[-0.04em] text-foreground sm:inline">
            Finboard
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
          <div className="flex items-center rounded-full bg-muted/70 p-1">
            {marketLinks.map((link) => (
              <NavPill key={link.market} link={link} active={isMarketActive(link)} />
            ))}
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-6" />

          {utilityLinks.map((link) => (
            <UtilityLink key={link.href} link={link} active={link.match(pathname)} />
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                className="h-9 w-52 rounded-full border-border/80 bg-muted/40 pl-9 lg:w-60"
                placeholder="Search investments…"
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
            <PopoverContent className="w-80 rounded-2xl p-0" align="end">
              <div className="border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results</p>
              </div>
              <ScrollArea className="max-h-72">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-accent/60"
                    onClick={() => openInstrument(item.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {item.symbol}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.exchange}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{item.name}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          ) : null}
        </Popover>

        {/* Mobile search */}
        <Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full md:hidden"
                aria-label="Search investments"
              />
            }
          >
            <Search className="size-5" />
          </SheetTrigger>
          <SheetContent side="top" className="rounded-b-3xl px-4 pb-6">
            <SheetHeader className="sr-only">
              <SheetTitle>Search investments</SheetTitle>
            </SheetHeader>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                autoFocus
                className="h-11 rounded-full pl-9"
                placeholder="Search by name or symbol…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="mt-3 space-y-1">
              {searchResults.length ? (
                searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left hover:bg-accent"
                    onClick={() => openInstrument(item.symbol)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {item.symbol}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.exchange}</span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium">{item.name}</p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {search.trim() ? "No matches found." : "Type to search stocks and funds."}
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Notifications */}
        <Popover
          onOpenChange={(open) => {
            if (open && mergedNotifications.length) {
              markAppNotificationsRead.mutate(mergedNotifications);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Notifications">
              <Bell className="size-5" />
              {unreadCount ? (
                <Badge className="absolute -top-0.5 -right-0.5 size-5 justify-center rounded-full p-0 text-[10px]">
                  {Math.min(unreadCount, 9)}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 rounded-2xl p-0" align="end">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <strong className="text-sm">Notifications</strong>
              <Button variant="link" size="sm" className="h-auto p-0" asChild>
                <Link href="/banking">View banking</Link>
              </Button>
            </div>
            <ScrollArea className="max-h-80">
              {mergedNotifications.slice(0, 10).map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="flex items-start justify-between gap-2 border-b border-border px-4 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <strong className="text-sm">{item.title}</strong>
                    <p className="text-xs text-muted-foreground">{item.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => dismissNotification.mutate(item)}
                    aria-label="Remove notification"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              {!mergedNotifications.length ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Bell className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                  <p className="text-sm font-medium">All caught up</p>
                  <p className="text-xs text-muted-foreground">Banking and app alerts will show up here.</p>
                </div>
              ) : null}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <ThemeSelector />

        <ProfileMenu user={user} onLogout={handleLogout} />

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="Open menu" />
            }
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="font-black tracking-[-0.03em]">Navigate</SheetTitle>
              <SheetDescription>Markets, banking, and account shortcuts.</SheetDescription>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Markets
              </p>
              {marketLinks.map((link) => (
                <NavPill
                  key={link.market}
                  link={link}
                  active={isMarketActive(link)}
                  onNavigate={closeMobile}
                />
              ))}

              <Separator className="my-3" />

              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Account
              </p>
              {utilityLinks.map((link) => (
                <UtilityLink
                  key={link.href}
                  link={link}
                  active={link.match(pathname)}
                  onNavigate={closeMobile}
                  className="w-full justify-start"
                />
              ))}
              <UtilityLink
                link={{ href: "/documents", label: "Documents", icon: FileCheck2, match: (p) => p === "/documents" }}
                active={pathname === "/documents"}
                onNavigate={closeMobile}
                className="w-full justify-start"
              />
            </nav>

            <div className="mt-auto border-t border-border px-6 py-5">
              <div className="mb-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold">Appearance</p>
                  <p className="text-xs text-muted-foreground">Light, dark, or match your device</p>
                </div>
                <ThemeSelector variant="toggle" />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/15 font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.name || "Investor"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" className="mb-2 w-full justify-start" asChild>
                <Link href="/profile" onClick={closeMobile}>
                  <UserRound className="size-4" />
                  My profile
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
