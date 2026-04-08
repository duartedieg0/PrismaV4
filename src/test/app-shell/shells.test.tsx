import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { PublicShell } from "@/app-shell/public/public-shell";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { EmptyState } from "@/design-system/components/empty-state";
import { LoadingState } from "@/design-system/components/loading-state";

describe("app shells", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the public shell with navigation, breadcrumbs and feedback patterns", () => {
    render(
      <PublicShell
        title="Entrada"
        breadcrumbs={[{ label: "Inicio", href: "/" }]}
        notice="Experimente o novo shell publico."
      >
        <p>Conteudo publico</p>
      </PublicShell>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /breadcrumbs/i })).toBeInTheDocument();
    expect(screen.getByText(/experimente o novo shell publico/i)).toBeInTheDocument();
    expect(screen.getByText(/conteudo publico/i)).toBeInTheDocument();
  });

  it("renders the teacher shell with loading and empty slots", () => {
    render(
      <TeacherShell
        title="Dashboard"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
        ]}
        loadingSlot={<LoadingState message="Carregando provas" />}
        emptySlot={<EmptyState message="Nenhuma prova criada." />}
      >
        <p>Resumo do professor</p>
      </TeacherShell>,
    );

    expect(screen.getByRole("navigation", { name: /navegacao principal do professor/i })).toBeInTheDocument();
    expect(screen.getByText(/carregando provas/i)).toBeInTheDocument();
    expect(screen.getByText(/nenhuma prova criada/i)).toBeInTheDocument();
  });

  it("esconde o item 'Agentes IA de Suporte' quando FEATURE_SUPPORT_AGENTS não está definida", () => {
    vi.stubEnv("FEATURE_SUPPORT_AGENTS", "");

    render(
      <TeacherShell
        title="Dashboard"
        breadcrumbs={[{ label: "Inicio", href: "/" }]}
      >
        <p>conteudo</p>
      </TeacherShell>,
    );

    expect(screen.queryByText(/agentes ia de suporte/i)).not.toBeInTheDocument();
  });

  it("exibe o item 'Agentes IA de Suporte' quando FEATURE_SUPPORT_AGENTS=true", () => {
    vi.stubEnv("FEATURE_SUPPORT_AGENTS", "true");

    render(
      <TeacherShell
        title="Dashboard"
        breadcrumbs={[{ label: "Inicio", href: "/" }]}
      >
        <p>conteudo</p>
      </TeacherShell>,
    );

    expect(screen.getByText(/agentes ia de suporte/i)).toBeInTheDocument();
  });

  it("renders the admin shell with inline error and processing banner support", () => {
    render(
      <AdminShell
        title="Configuracoes"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Admin", href: "/config" },
        ]}
        inlineError="Falha ao sincronizar modelos."
        processingMessage="Sincronizando catalogo"
      >
        <p>Painel administrativo</p>
      </AdminShell>,
    );

    expect(screen.getByRole("navigation", { name: /navegacao principal do admin/i })).toBeInTheDocument();
    expect(screen.getByText(/falha ao sincronizar modelos/i)).toBeInTheDocument();
    expect(screen.getByText(/sincronizando catalogo/i)).toBeInTheDocument();
  });
});
