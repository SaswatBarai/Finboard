import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, description, tone }) {
  return (
    <Card className={cn(tone === "warning" && "border-amber-500/30", tone === "success" && "border-emerald-500/30", tone === "danger" && "border-rose-500/30")}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
        {Icon ? <Icon className="size-5 text-primary" /> : null}
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
