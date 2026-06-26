import { indices } from "../../investments/data/market-data";

export default function MarketTicker() {
  const items = [...indices, ...indices];

  return (
    <div className="overflow-hidden border-b border-border bg-card/50">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-8 px-4 py-2 text-sm">
        {items.map(([name, value, change], index) => (
          <span key={`${name}-${index}`} className="whitespace-nowrap">
            <strong className="text-foreground">{name}</strong>{" "}
            <span className="text-muted-foreground">{value}</span>{" "}
            <em className={String(change).startsWith("-") ? "text-down not-italic" : "text-up not-italic"}>{change}</em>
          </span>
        ))}
      </div>
    </div>
  );
}
