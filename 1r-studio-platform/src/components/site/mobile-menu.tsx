"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

export function MobileMenu({
  links,
  bookLabel,
  trackLabel,
}: {
  links: { href: string; label: string }[];
  bookLabel: string;
  trackLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-200 text-navy-800"
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-t border-navy-100 bg-cream-50 px-4 py-6 shadow-lg">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium text-navy-800">
                {l.label}
              </Link>
            ))}
            <Link href="/track" onClick={() => setOpen(false)} className="text-base font-medium text-navy-600">
              {trackLabel}
            </Link>
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-navy-800 px-6 py-3 text-center text-sm font-semibold text-cream-50"
            >
              {bookLabel}
            </Link>
            <LanguageSwitcher className="self-start" />
          </nav>
        </div>
      )}
    </div>
  );
}
