"use client";

import { createClient } from "@/gateways/supabase/client";

export default function LoginPage() {
  async function handleGoogleLogin() {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login/callback`,
      },
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "var(--space-section) var(--space-gutter)",
      }}
    >
      <section
        style={{
          width: "min(100%, 32rem)",
          border: "1px solid var(--color-border-subtle)",
          background: "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,242,255,0.88))",
          borderRadius: "var(--radius-panel)",
          padding: "2rem",
          boxShadow: "var(--shadow-strong)",
        }}
      >
        <p style={{ margin: 0, color: "var(--color-text-accent)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.78rem" }}>
          Acesso seguro
        </p>
        <h1 style={{ marginTop: "0.75rem" }}>Entrar</h1>
        <p style={{ color: "var(--color-text-muted)" }}>Entre com sua conta Google para acessar a plataforma.</p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            marginTop: "1rem",
          }}
        >
          Entrar com Google
        </button>
      </section>
    </main>
  );
}
