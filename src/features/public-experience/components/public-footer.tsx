import Link from "next/link";
import { Logo } from "@/design-system/components/logo";

const footerLinks = {
  Produto: [
    { label: "Plataforma", href: "#" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Recursos", href: "#recursos" },
    { label: "Preços", href: "#" },
  ],
  Suporte: [
    { label: "Central de ajuda", href: "#" },
    { label: "Contato", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos de uso", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-brand-950">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Logo size="sm" variant="mono" />
            <p className="max-w-xs text-sm leading-relaxed text-brand-300">
              Plataforma educacional com IA para adaptar avaliações e promover inclusão na sala de aula.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-200">
                {section}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-300 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-brand-800 pt-6 text-center">
          <p className="text-xs text-brand-400/60">
            © {new Date().getFullYear()} Adapte Minha Prova. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
