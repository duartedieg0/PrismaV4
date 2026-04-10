import Anthropic from "@anthropic-ai/sdk";
import { TEA_CONSULTANT_INSTRUCTIONS } from "../src/mastra/prompts/tea-consultant-prompt";

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
  console.warn(
    "⚠️  AVISO: Este script não é idempotente. Executá-lo novamente cria recursos duplicados.",
  );
  console.warn(
    "   Se precisar re-executar, delete os recursos anteriores via Anthropic Console.\n",
  );

  // 1. Criar o Agent
  console.log("Criando Agent TEA Consultant...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = await (client.beta as any).agents.create({
    name: "TEA Consultant",
    model: "claude-sonnet-4-6",
    instructions: MANAGED_AGENT_SYSTEM_PROMPT,
    tools: {
      toolset: "agent_toolset_20260401",
      default_config: { enabled: false },
    },
  });
  console.log("✓ Agent criado:", agent.id);

  // 2. Criar o Environment
  console.log("Criando Environment tea-consultant-env...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const environment = await (client.beta as any).environments.create({
    name: "tea-consultant-env",
    type: "cloud",
    networking: "unrestricted",
  });
  console.log("✓ Environment criado:", environment.id);

  // 3. Criar o Memory Store
  console.log("Criando Memory Store TEA Knowledge Base...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memoryStore = await (client.beta as any).memory.stores.create({
    name: "TEA Knowledge Base",
    description:
      "Base de conhecimento sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas. O agente deve consultar esta base SEMPRE antes de responder perguntas.",
  });
  console.log("✓ Memory Store criado:", memoryStore.id);

  // Imprimir IDs no formato .env
  console.log("\n--- Copie para seu .env.local ---");
  console.log(`MANAGED_AGENT_ID=${agent.id}`);
  console.log(`MANAGED_AGENT_ENVIRONMENT_ID=${environment.id}`);
  console.log(`MANAGED_AGENT_MEMORY_STORE_ID=${memoryStore.id}`);
  console.log("---------------------------------\n");
}

main().catch((error) => {
  console.error("Erro ao provisionar recursos:", error);
  process.exit(1);
});
