import type { Metadata } from "next";
import { IBM_Plex_Mono, Literata, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const editorialSerif = Literata({
  subsets: ["latin"],
  variable: "--font-editorial",
});

const interfaceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-interface",
});

const interfaceMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Adapte Minha Prova",
  description:
    "Adapte avaliações para estudantes com necessidades educacionais específicas em minutos.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${editorialSerif.variable} ${interfaceSans.variable} ${interfaceMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
