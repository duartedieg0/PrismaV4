import Link from "next/link";

export function ProfileCompletionBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3">
      <p className="text-sm font-medium text-brand-800">
        Complete seu perfil para uma experiencia personalizada.
      </p>
      <Link
        href="/profile"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
      >
        Completar perfil →
      </Link>
    </div>
  );
}
