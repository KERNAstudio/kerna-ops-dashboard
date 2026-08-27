"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActionRequiredItem } from "@/lib/action-required";

export function ActionRequiredBell({ items }: { items: ActionRequiredItem[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1.5 text-xs font-bold text-error"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        {items.length} action{items.length === 1 ? "" : "s"} required
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-80 rounded-[var(--radius-default)] border border-border-default bg-bg-card shadow-lg">
          <div className="border-b border-border-default p-3 text-sm font-bold">Action Required</div>
          <div className="max-h-96 overflow-y-auto">
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 border-t border-border-default px-3 py-2.5 text-xs first:border-t-0 hover:bg-bg-elevated"
              >
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${item.severity === "high" ? "bg-error" : "bg-warning"}`} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
