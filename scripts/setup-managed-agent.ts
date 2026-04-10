import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { TEA_CONSULTANT_INSTRUCTIONS } from "../src/mastra/prompts/tea-consultant-prompt";

// tsx não carrega .env.local automaticamente — fazer manualmente
try {
  const envContent = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
} catch {
  // .env.local não encontrado — continua sem ele
}

const client = new Anthropic();

// Adaptar o system prompt: substituir referência à ferramenta de busca pela instrução de memory store
const ORIGINAL_TOOL_INSTRUCTION = "Use a ferramenta de busca disponível.";
if (!TEA_CONSULTANT_INSTRUCTIONS.includes(ORIGINAL_TOOL_INSTRUCTION)) {
  console.error(
    "ERRO: A string de substituição do system prompt não foi encontrada.",
    "Verifique o conteúdo de TEA_CONSULTANT_INSTRUCTIONS antes de prosseguir.",
  );
  process.exit(1);
}
const MANAGED_AGENT_SYSTEM_PROMPT = TEA_CONSULTANT_INSTRUCTIONS.replace(
  ORIGINAL_TOOL_INSTRUCTION,
  "Consulte a base de conhecimento (memory store) antes de responder.",
);

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Erro: ANTHROPIC_API_KEY não encontrada em process.env.");
    console.error("Adicione ANTHROPIC_API_KEY ao seu .env.local antes de executar este script.");
    process.exit(1);
  }

  console.warn(
    "⚠️  AVISO: Este script não é idempotente. Executá-lo novamente cria recursos duplicados.",
  );
  console.warn(
    "   Se precisar re-executar, delete os recursos anteriores via Anthropic Console.\n",
  );

  const createdResources: { type: string; id: string }[] = [];

  try {
    // 1. Criar o Agent
    console.log("Criando Agent TEA Consultant...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent = await (client.beta as any).agents.create({
      name: "TEA Consultant",
      model: "claude-sonnet-4-6",
      instructions: MANAGED_AGENT_SYSTEM_PROMPT,
      tools: [
        {
          type: "agent_toolset_20260401",
          default_config: { enabled: false },
        },
      ],
    });
    createdResources.push({ type: "Agent", id: agent.id });
    console.log("✓ Agent criado:", agent.id);

    // 2. Criar o Environment
    console.log("Criando Environment tea-consultant-env...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const environment = await (client.beta as any).environments.create({
      name: "tea-consultant-env",
      type: "cloud",
      networking: "unrestricted",
    });
    createdResources.push({ type: "Environment", id: environment.id });
    console.log("✓ Environment criado:", environment.id);

    // 3. Criar o Memory Store
    console.log("Criando Memory Store TEA Knowledge Base...");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoryStore = await (client.beta as any).memory.stores.create({
      name: "TEA Knowledge Base",
      description:
        "Base de conhecimento sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas. O agente deve consultar esta base SEMPRE antes de responder perguntas.",
    });
    createdResources.push({ type: "Memory Store", id: memoryStore.id });
    console.log("✓ Memory Store criado:", memoryStore.id);

    // Imprimir IDs no formato .env
    console.log("\n--- Copie para seu .env.local ---");
    console.log(`MANAGED_AGENT_ID=${agent.id}`);
    console.log(`MANAGED_AGENT_ENVIRONMENT_ID=${environment.id}`);
    console.log(`MANAGED_AGENT_MEMORY_STORE_ID=${memoryStore.id}`);
    console.log("---------------------------------");
    console.log("✓ Provisionamento completo! Adicione as vars acima ao .env.local e reinicie o app.\n");

  } catch (error) {
    console.error("\n❌ Erro durante o provisionamento:", error);
    if (createdResources.length > 0) {
      console.error("\nRecursos criados antes da falha (delete manualmente via Anthropic Console antes de re-executar):");
      for (const resource of createdResources) {
        console.error(`  - ${resource.type}: ${resource.id}`);
      }
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Erro inesperado:", error);
  process.exit(1);
});
