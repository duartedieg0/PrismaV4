import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { PublicShell } from "@/app-shell/public/public-shell";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";

describe("app shells accessibility", () => {
  it("keeps the public shell accessible", async () => {
    const { container } = render(
      <PublicShell
        title="Entrada"
        breadcrumbs={[{ label: "Inicio", href: "/" }]}
        notice="Experimente o novo shell publico."
      >
        <p>Conteudo publico</p>
      </PublicShell>,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("keeps the teacher shell accessible", async () => {
    const { container } = render(
      <TeacherShell
        title="Início"
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Início", href: "/dashboard" },
        ]}
        loadingMessage="Carregando provas"
        emptyMessage="Nenhuma prova criada."
      >
        <p>Resumo do professor</p>
      </TeacherShell>,
    );

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("keeps the admin shell accessible", async () => {
    const { container } = render(
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

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
