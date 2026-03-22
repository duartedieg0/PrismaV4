export const PRODUCT_ERROR_CATEGORIES = [
  "validation",
  "authentication",
  "authorization",
  "domain",
  "integration",
  "processing",
  "infrastructure",
] as const;

export type ProductErrorCategory = (typeof PRODUCT_ERROR_CATEGORIES)[number];

export const DEFAULT_PRODUCT_ERROR_CATEGORY: ProductErrorCategory =
  "infrastructure";

export function getDefaultProductErrorCategory(): ProductErrorCategory {
  return DEFAULT_PRODUCT_ERROR_CATEGORY;
}

export const PRODUCT_ERROR_SOURCES = [
  "client",
  "server",
  "database",
  "storage",
  "external_service",
  "runtime",
  "workflow",
] as const;

export type ProductErrorSource = (typeof PRODUCT_ERROR_SOURCES)[number];

export const PRODUCT_ERROR_STAGES = [
  "validation",
  "authorization",
  "persistence",
  "processing",
  "integration",
  "delivery",
  "unknown",
] as const;

export type ProductErrorStage = (typeof PRODUCT_ERROR_STAGES)[number];

export interface ProductErrorEntity {
  type: string;
  id?: string;
}

export interface ProductError {
  category: ProductErrorCategory;
  code: string;
  message: string;
  safeMessage: string;
  source: ProductErrorSource;
  stage: ProductErrorStage;
  entity?: ProductErrorEntity;
  cause?: unknown;
  details?: Record<string, unknown>;
}
