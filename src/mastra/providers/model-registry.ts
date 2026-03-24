export interface AiModelRecord {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  isDefault: boolean;
}

type ResolveExtractionModelOptions = {
  models: AiModelRecord[];
};

type ResolveAnalysisModelOptions = {
  models: AiModelRecord[];
  supportModelId: string | null;
};

export class ModelResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelResolutionError";
  }
}

export function toMastraModelId(model: AiModelRecord): string {
  return `${model.provider}/${model.modelId}`;
}

export function resolveExtractionModel({
  models,
}: ResolveExtractionModelOptions): AiModelRecord {
  const defaultModel = models.find((model) => model.isDefault);

  if (defaultModel) {
    if (!defaultModel.enabled) {
      throw new ModelResolutionError(
        "O modelo padrão configurado está desabilitado.",
      );
    }

    return defaultModel;
  }

  const fallbackModel = models.find((model) => model.enabled);

  if (!fallbackModel) {
    throw new ModelResolutionError(
      "Nenhum modelo de IA habilitado foi encontrado.",
    );
  }

  return fallbackModel;
}

export function resolveAnalysisModel({
  models,
  supportModelId,
}: ResolveAnalysisModelOptions): AiModelRecord {
  if (supportModelId) {
    const supportModel = models.find((model) => model.id === supportModelId);

    if (!supportModel) {
      throw new ModelResolutionError(
        "O modelo configurado para o apoio não foi encontrado.",
      );
    }

    if (!supportModel.enabled) {
      throw new ModelResolutionError(
        "O modelo configurado para o apoio está desabilitado.",
      );
    }

    return supportModel;
  }

  return resolveExtractionModel({
    models,
  });
}
