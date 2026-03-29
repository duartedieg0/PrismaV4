const stats = [
  { value: "+2.500", label: "Professores ativos" },
  { value: "15.000+", label: "Provas adaptadas" },
  { value: "85%", label: "Tempo economizado" },
];

export function TrustStrip() {
  return (
    <section className="bg-surface-muted py-10">
      <div className="container-page">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:divide-x sm:divide-border-default sm:gap-0">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 sm:px-12">
              <span className="text-4xl font-bold tracking-tight text-brand-600">
                {stat.value}
              </span>
              <span className="text-sm text-text-secondary">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
