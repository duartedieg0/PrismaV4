import type {
  ProductError,
  ProductErrorCategory,
  ProductErrorSource,
  ProductErrorStage,
} from "@/domains/errors/contracts";

type CreateProductErrorInput = {
  category: ProductErrorCategory;
  code: string;
  message: string;
  safeMessage: string;
  source: ProductErrorSource;
  stage: ProductErrorStage;
  cause?: unknown;
  details?: Record<string, unknown>;
};

export function createProductError(
  input: CreateProductErrorInput,
): ProductError {
  return {
    ...input,
  };
}

export function toPublicError(error: ProductError) {
  return {
    code: error.code,
    message: error.safeMessage,
  };
}
