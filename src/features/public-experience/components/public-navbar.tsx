"use client";

import Link from "next/link";
import { Logo } from "@/design-system/components/logo";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-white/80 backdrop-blur-lg transition-colors">
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Navegação principal">
        <Link href="/" className="shrink-0">
          <Logo size="sm" variant="full" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">Comece grátis</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-border-default bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="outline" size="md" fullWidth>Entrar</Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth>Comece grátis</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
