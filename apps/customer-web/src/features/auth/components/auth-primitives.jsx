import Link from "next/link";
import { cn } from "@/lib/utils";

export function AuthLink({ href, children, className }) {
  return (
    <Link href={href} className={cn("font-semibold text-foreground underline-offset-4 hover:underline", className)}>
      {children}
    </Link>
  );
}

export function AuthFooterText({ children }) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>;
}
