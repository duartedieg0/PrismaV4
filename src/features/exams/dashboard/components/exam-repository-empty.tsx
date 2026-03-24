import Link from "next/link";
import { EmptyState } from "@/design-system/components/empty-state";
import { Button } from "@/design-system/components/button";
import { FileText } from "lucide-react";

export function ExamRepositoryEmpty() {
  return (
    <EmptyState
      title="Nenhuma prova adaptada ainda"
      message="Comece criando sua primeira adaptação de prova. O processo leva apenas alguns minutos."
      icon={<FileText className="h-6 w-6" />}
      action={
        <Link href="/exams/new">
          <Button variant="primary" size="md">+ Nova Prova</Button>
        </Link>
      }
    />
  );
}
