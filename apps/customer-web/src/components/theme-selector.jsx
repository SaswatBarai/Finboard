"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

function ThemeIcon({ theme, resolvedTheme, className }) {
  if (theme === "system") {
    return <Laptop className={className} aria-hidden />;
  }

  if (resolvedTheme === "light") {
    return <Sun className={className} aria-hidden />;
  }

  return <Moon className={className} aria-hidden />;
}

export function ThemeSelector({ variant = "menu", className, buttonClassName }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (variant === "toggle") {
    return (
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={mounted ? theme : "dark"}
        onValueChange={(value) => value && setTheme(value)}
        className={cn("w-full sm:w-fit", className)}
      >
        {THEMES.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className="h-10 flex-1 gap-1.5 px-3 sm:flex-none sm:px-4"
            aria-label={item.label}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className="text-sm">{item.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("rounded-full", buttonClassName)}
            aria-label="Choose theme"
          />
        }
      >
        <ThemeIcon
          theme={mounted ? theme : "dark"}
          resolvedTheme={mounted ? resolvedTheme : "dark"}
          className="size-4"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup value={mounted ? theme : "dark"} onValueChange={setTheme}>
          {THEMES.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
