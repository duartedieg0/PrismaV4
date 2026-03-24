import Link from "next/link";
import { Logo } from "@/design-system/components/logo";

const footerLinks = {
  produto: [
    { label: "Plataforma", href: "#" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Recursos", href: "#recursos" },
    { label: "Preços", href: "#" },
  ],
  suporte: [
    { label: "Central de ajuda", href: "#" },
    { label: "Contato", href: "#" },
    { label: "Status", href: "#" },
  ],
  legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos de uso", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="border-t border-border-default bg-surface-muted/50">
      <div className="container-page py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Logo size="sm" variant="full" />
            <p className="max-w-xs text-sm leading-relaxed text-text-secondary">
              Plataforma educacional com IA para adaptar avaliações e promover inclusão na sala de aula.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
                {section}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border-default pt-6 text-center">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Adapte Minha Prova. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
