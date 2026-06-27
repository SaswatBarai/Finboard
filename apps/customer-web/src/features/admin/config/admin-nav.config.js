import { Building2, History, Home, Landmark, ShieldCheck } from "lucide-react";

export const ADMIN_ROLE_LABELS = {
  admin: "Platform Admin",
  rta_admin: "RTA Admin",
  amc_admin: "AMC Admin"
};

export const ADMIN_NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    href: "/admin/dashboard",
    roles: ["admin"],
    icon: Home,
    badge: "Console",
    description: "Operations workspace overview and quick links to all admin modules."
  },
  {
    id: "kyc",
    label: "KYC Review",
    href: "/admin/kyc",
    roles: ["admin", "rta_admin"],
    icon: ShieldCheck,
    badge: "KYC Review Admin",
    description: "Review investor identity, OCR output, AI scores, and approve or reject applications."
  },
  {
    id: "audit",
    label: "Audit",
    href: "/admin/audit",
    roles: ["admin", "rta_admin"],
    icon: History,
    badge: "Compliance",
    description: "Look up append-only compliance history for KYC submissions, approvals, and rejections."
  },
  {
    id: "banking",
    label: "Banking",
    href: "/admin/banking",
    roles: ["admin"],
    icon: Landmark,
    badge: "Operations Admin",
    description: "Monitor demo bank accounts, freeze users, reset balances, and view all transactions."
  },
  {
    id: "amc",
    label: "AMC",
    href: "/admin/amc",
    roles: ["admin", "amc_admin"],
    icon: Building2,
    badge: "AMC Manager",
    description: "Approve mutual fund and SIP orders, track AUM, and manage scheme operations."
  }
];

export function getAdminNavItemsForRole(role) {
  if (!role) {
    return [];
  }

  return ADMIN_NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getHubModulesForRole(role) {
  return getAdminNavItemsForRole(role).filter((item) => item.id !== "home");
}

export function isAdminNavItemActive(pathname, href) {
  if (href === "/admin/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
