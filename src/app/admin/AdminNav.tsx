"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/changes", label: "Changes" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/lists", label: "Lists" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav({ counts }: { counts: { reports: number; suggestions: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
          const count = t.label === "Reports" ? counts.reports : t.label === "Suggestions" ? counts.suggestions : 0;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-1 whitespace-nowrap border-b-2 px-3 text-sm font-medium ${
                  active ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {t.label}
                {count > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
