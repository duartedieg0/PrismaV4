import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "../chunker";

const SAMPLE_MD = `# Documento TEA

## Princípios Gerais

### Princípio 1: Clareza Visual

Texto sobre clareza visual na adaptação de questões.
Mais detalhes sobre o princípio.

### Princípio 2: Linguagem Objetiva

Texto sobre linguagem objetiva.

## Legislação

### Lei Brasileira de Inclusão

Detalhes sobre a LBI e TEA.

## Anti-padrões

### Infantilização

Exemplo de infantilização e por que evitar.
`;

describe("chunkMarkdown", () => {
  it("should split by ## and ### headers", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    expect(chunks.length).toBeGreaterThanOrEqual(4);
  });

  it("should include metadata in each chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    for (const chunk of chunks) {
      expect(chunk.metadata).toHaveProperty("source", "test-doc.md");
      expect(chunk.metadata).toHaveProperty("section");
      expect(chunk.text).toBeTruthy();
    }
  });

  it("should detect section types from content", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    const legislacaoChunk = chunks.find((c) =>
      c.metadata.section.includes("Legislação"),
    );
    expect(legislacaoChunk?.metadata.type).toBe("legislação");

    const antiPadraoChunk = chunks.find((c) =>
      c.metadata.section.includes("Anti-padrões"),
    );
    expect(antiPadraoChunk?.metadata.type).toBe("anti-padrão");
  });
});
