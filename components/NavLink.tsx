"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Highlights the page you're actually on. Needs the real pathname, so it's a
 * client component — the layout is a server component and can't read it.
 */
export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-2 py-1.5 whitespace-nowrap transition sm:px-3 ${
        active
          ? "bg-jungle-800 font-semibold text-tiger"
          : "text-bone-dim hover:bg-jungle-800 hover:text-leaf"
      }`}
    >
      {children}
    </Link>
  );
}
