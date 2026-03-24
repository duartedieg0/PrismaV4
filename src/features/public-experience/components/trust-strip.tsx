import { StatCard } from "@/design-system/components/stat-card";
import { Users, FileCheck, Clock } from "lucide-react";

export function TrustStrip() {
  return (
    <section className="border-y border-border-default bg-surface-muted/50 py-12">
      <div className="container-page grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Professores"
          value="+2.500"
          trend="ativos na plataforma"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Provas adaptadas"
          value="15.000+"
          trend="e crescendo"
          icon={<FileCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Tempo economizado"
          value="85%"
          trend="em média por prova"
          icon={<Clock className="h-5 w-5" />}
        />
      </div>
    </section>
  );
}
