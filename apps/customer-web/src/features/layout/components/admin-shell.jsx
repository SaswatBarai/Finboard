"use client";

import { Separator } from "@/components/ui/separator";

export default function AdminShell({ title, description, children }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {title ? (
        <header className="mb-6 space-y-1">
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        </header>
      ) : null}
      {children}
    </div>
  );
}

export function AdminSection({ title, description, action, children }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {title ? <h2 className="text-xl font-semibold tracking-tight">{title}</h2> : null}
        </div>
        {action}
      </div>
      <Separator />
      {children}
    </section>
  );
}
