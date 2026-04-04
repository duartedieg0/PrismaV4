"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, BookOpen, BrainCircuit } from "lucide-react";
import { Badge } from "@/design-system/components/badge";

type PedagogicalDetailsProps = {
  bnccSkills: string[] | null;
  bloomLevel: string | null;
  bnccAnalysis: string | null;
  bloomAnalysis: string | null;
};

export function PedagogicalDetails({
  bnccSkills,
  bloomLevel,
  bnccAnalysis,
  bloomAnalysis,
}: PedagogicalDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
        Detalhes pedagógicos
      </button>
      {isOpen ? (
        <div className="flex flex-col gap-2 animate-fade-in">
          <div className="flex flex-wrap gap-2">
            {bnccSkills?.map((skill) => (
              <Badge key={skill} variant="default" size="sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {skill}
                </span>
              </Badge>
            ))}
            {bloomLevel ? (
              <Badge variant="success" size="sm">
                <span className="flex items-center gap-1">
                  <BrainCircuit className="h-3 w-3" />
                  {bloomLevel}
                </span>
              </Badge>
            ) : null}
          </div>
          {bnccAnalysis ? (
            <p className="text-xs leading-relaxed text-text-muted">{bnccAnalysis}</p>
          ) : null}
          {bloomAnalysis ? (
            <p className="text-xs leading-relaxed text-text-muted">{bloomAnalysis}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
