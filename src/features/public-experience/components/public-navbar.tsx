"use client";

import Link from "next/link";
import { Logo } from "@/design-system/components/logo";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Como a IA atua?", href: "#depoimentos" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border-default bg-white transition-shadow",
        scrolled && "shadow-xs",
      )}
    >
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
              className="text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-brand-600"
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
            <Button variant="primary" size="sm" className="rounded-full">Comece agora</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-600 md:hidden"
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
                className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-600"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="ghost" size="md" fullWidth>Entrar</Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth className="rounded-full">Comece agora</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
