import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/design-system/components/logo";
import { Breadcrumbs } from "@/design-system/components/breadcrumbs";
import { PageHeader } from "@/design-system/components/page-header";
import { Button } from "@/design-system/components/button";
import { InlineError } from "@/design-system/components/inline-error";
import { ProcessingBanner } from "@/design-system/components/processing-banner";
import {
  Home,
  Cpu,
  Bot,
  HeartHandshake,
  BookOpen,
  GraduationCap,
  Users,
  User,
  LogOut,
} from "lucide-react";

type AdminNavId =
  | "home"
  | "models"
  | "agents"
  | "supports"
  | "subjects"
  | "grade-levels"
  | "users";

type AdminShellProps = Readonly<{
  title: string;
  breadcrumbs: { label: string; href: string }[];
  description?: string;
  activeNav?: AdminNavId;
  primaryAction?: {
    label: string;
    href: string;
    ariaLabel?: string;
  };
  inlineError?: string;
  processingMessage?: string;
  children: React.ReactNode;
}>;

const navigationItems = [
  { id: "home" as const, label: "Início", href: "/config", icon: Home },
  { id: "models" as const, label: "Modelos", href: "/config/models", icon: Cpu },
  { id: "agents" as const, label: "Agentes", href: "/config/agents", icon: Bot },
  { id: "supports" as const, label: "Apoios", href: "/config/supports", icon: HeartHandshake },
  { id: "subjects" as const, label: "Disciplinas", href: "/config/subjects", icon: BookOpen },
  { id: "grade-levels" as const, label: "Anos/Séries", href: "/config/grade-levels", icon: GraduationCap },
  { id: "users" as const, label: "Usuários", href: "/users", icon: Users },
];

export function AdminShell({
  title,
  breadcrumbs,
  description,
  activeNav = "home",
  primaryAction,
  inlineError,
  processingMessage,
  children,
}: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border-default bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-5">
          <Link href="/config">
            <Logo size="sm" variant="full" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4" aria-label="Navegacao principal do admin">
          <div className="flex flex-col gap-1">
            {navigationItems.map((item) => {
              const isActive = item.id === activeNav;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-600 text-white shadow-soft"
                      : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom */}
        <div className="border-t border-border-default p-3">
          <div className="flex flex-col gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            >
              <User className="h-4.5 w-4.5" />
              Perfil
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border-default bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/config">
          <Logo size="sm" variant="full" />
        </Link>
        <div className="flex items-center gap-2">
          {navigationItems.map((item) => {
            const isActive = item.id === activeNav;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-brand-600 text-white" : "text-text-secondary hover:bg-surface-muted",
                )}
                aria-label={item.label}
              >
                <Icon className="h-4.5 w-4.5" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="container-page py-6 lg:py-8">
          <div className="flex flex-col gap-6">
            <Breadcrumbs items={breadcrumbs} />
            <PageHeader
              title={title}
              eyebrow="Administração"
              description={
                description ??
                "Uma superfície administrativa clara para catálogos, runtime de IA, usuários e evolução supervisionada."
              }
              actions={
                primaryAction ? (
                  <Link href={primaryAction.href} aria-label={primaryAction.ariaLabel}>
                    <Button variant="accent" size="md">
                      + {primaryAction.label}
                    </Button>
                  </Link>
                ) : null
              }
            />
            {processingMessage ? <ProcessingBanner message={processingMessage} /> : null}
            {inlineError ? <InlineError message={inlineError} /> : null}
            <div>{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
