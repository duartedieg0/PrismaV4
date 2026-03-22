import Link from "next/link";
import { Breadcrumbs } from "@/design-system/components/breadcrumbs";
import { PageHeader } from "@/design-system/components/page-header";

type TeacherShellProps = Readonly<{
  title: string;
  breadcrumbs: { label: string; href: string }[];
  description?: string;
  activeNav?: "dashboard" | "new-exam" | "results";
  primaryAction?: {
    label: string;
    href: string;
    ariaLabel?: string;
  };
  loadingMessage?: string;
  emptyMessage?: string;
  loadingSlot?: React.ReactNode;
  emptySlot?: React.ReactNode;
  children: React.ReactNode;
}>;

export function TeacherShell({
  title,
  breadcrumbs,
  description,
  activeNav = "dashboard",
  primaryAction,
  loadingSlot,
  emptySlot,
  children,
}: TeacherShellProps) {
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "new-exam", label: "Nova Prova", href: "/exams/new" },
  ] as const;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "15rem minmax(0, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            position: "sticky",
            top: "1rem",
            minHeight: "calc(100vh - 2rem)",
            display: "grid",
            gridTemplateRows: "auto 1fr auto",
            gap: "1.75rem",
            padding: "1.3rem 1rem",
            borderRadius: "1.4rem",
            background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(244,244,241,0.96))",
            boxShadow: "0 18px 42px rgba(28,25,23,0.06)",
            border: "1px solid rgba(110,122,117,0.08)",
          }}
        >
          <div style={{ display: "grid", gap: "0.45rem", paddingInline: "0.35rem" }}>
            <strong
              style={{
                fontSize: "1.85rem",
                lineHeight: 1,
                color: "var(--accent-strong)",
                letterSpacing: "-0.05em",
              }}
            >
              Adapte Minha Prova
            </strong>
            <span
              style={{
                color: "rgba(97,112,107,0.82)",
                fontSize: "0.66rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Painel do professor
            </span>
          </div>

          <nav aria-label="Navegacao principal do professor">
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {navigationItems.map((item) => {
                const isActive = item.id === activeNav;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      minHeight: "3rem",
                      padding: "0.8rem 0.95rem",
                      borderRadius: "0.9rem",
                      textDecoration: "none",
                      fontWeight: 700,
                      color: isActive ? "white" : "rgba(26,28,27,0.74)",
                      background: isActive ? "#0d7c66" : "transparent",
                      boxShadow: isActive ? "0 10px 28px rgba(13,124,102,0.18)" : "none",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "0.55rem",
                        height: "0.55rem",
                        borderRadius: "0.2rem",
                        background: isActive ? "rgba(255,255,255,0.95)" : "rgba(97,112,107,0.44)",
                      }}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div style={{ display: "grid", gap: "0.4rem", alignSelf: "end" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.8rem 0.95rem",
                color: "rgba(26,28,27,0.7)",
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "0.9rem",
                  height: "0.9rem",
                  borderRadius: "999px",
                  border: "2px solid rgba(97,112,107,0.5)",
                }}
              />
              Perfil
            </div>
            <Link
              href="/logout"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.8rem 0.95rem",
                borderRadius: "0.8rem",
                color: "rgba(26,28,27,0.72)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "0.95rem",
                  height: "0.95rem",
                  borderRadius: "0.2rem",
                  border: "2px solid rgba(97,112,107,0.5)",
                }}
              />
              Sair
            </Link>
          </div>
        </aside>

        <main
          style={{
            minWidth: 0,
            padding: "2rem 1.2rem 3rem 0.25rem",
          }}
        >
          <div style={{ width: "min(100%, 78rem)", display: "grid", gap: "1.5rem" }}>
            <Breadcrumbs items={breadcrumbs} />
            <PageHeader
              title={title}
              eyebrow="Fluxo pedagógico"
              description={
                description ??
                "Uma área operacional clara para acompanhar o pipeline da prova, da criação ao resultado final."
              }
              actions={
                primaryAction ? (
                  <Link
                    href={primaryAction.href}
                    aria-label={primaryAction.ariaLabel}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "3rem",
                      paddingInline: "1.25rem",
                      borderRadius: "0.85rem",
                      background: "linear-gradient(135deg, #9a6100, #c88718)",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 800,
                      boxShadow: "0 14px 30px rgba(154, 97, 0, 0.16)",
                    }}
                  >
                    + {primaryAction.label}
                  </Link>
                ) : null
              }
            />
            {loadingSlot}
            {emptySlot}
            <div>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
