"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close after navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        className="btn-secondary btn-sm"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav id="mobile-menu" className="absolute inset-x-0 top-14 border-b border-border bg-surface px-4 py-2 shadow-lg">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-3 font-medium hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
