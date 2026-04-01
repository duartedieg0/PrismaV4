export interface DocumentChunk {
  text: string;
  metadata: {
    source: string;
    section: string;
    subsection: string;
    type: "princípio" | "regra" | "anti-padrão" | "exemplo" | "legislação" | "geral";
  };
}

const TYPE_PATTERNS: [RegExp, DocumentChunk["metadata"]["type"]][] = [
  [/legisla[çc][aã]o|lei\s|decreto|portaria|resolu[çc][aã]o/i, "legislação"],
  [/anti[-\s]?padr[aãoõ]/i, "anti-padrão"],
  [/princ[ií]pio|diretriz/i, "princípio"],
  [/exemplo|caso|ilustra/i, "exemplo"],
  [/regra|obrigat[oó]ri|deve[-\s]?se|nunca|sempre/i, "regra"],
];

function detectType(
  sectionTitle: string,
  content: string,
): DocumentChunk["metadata"]["type"] {
  const combined = `${sectionTitle} ${content}`;
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(combined)) return type;
  }
  return "geral";
}

export function chunkMarkdown(
  markdown: string,
  source: string,
): DocumentChunk[] {
  const lines = markdown.split("\n");
  const chunks: DocumentChunk[] = [];

  let currentSection = "";
  let currentSubsection = "";
  let currentContent: string[] = [];

  function flushChunk() {
    const text = currentContent.join("\n").trim();
    if (!text) return;

    chunks.push({
      text,
      metadata: {
        source,
        section: currentSection || "Introdução",
        subsection: currentSubsection,
        type: detectType(
          `${currentSection} ${currentSubsection}`,
          text,
        ),
      },
    });
    currentContent = [];
  }

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h2Match) {
      flushChunk();
      currentSection = h2Match[1].trim();
      currentSubsection = "";
      continue;
    }

    if (h3Match) {
      flushChunk();
      currentSubsection = h3Match[1].trim();
      continue;
    }

    // Ignorar h1 (título do documento)
    if (line.match(/^# /)) continue;

    currentContent.push(line);
  }

  flushChunk();
  return chunks;
}
