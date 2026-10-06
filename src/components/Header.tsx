import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { MobileMenu } from "./MobileMenu";

export async function Header() {
  const user = await getCurrentUser();
  const links = [
    { href: "/", label: "Rinks" },
    { href: "/rinks/new", label: "Add a rink" },
    ...(user?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
    user ? { href: "/account", label: user.displayName } : { href: "/login", label: "Log in" },
  ];

  return (
    <header className="sticky top-0 z-[1000] border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-on-primary">
            🏒
          </span>
          <span>
            Barn<span className="text-accent">Finder</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">
              {l.label}
            </Link>
          ))}
        </nav>
        <MobileMenu links={links} />
      </div>
    </header>
  );
}
