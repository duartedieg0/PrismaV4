import type { ProductError } from "@/domains/errors/contracts";
import { toPublicError } from "@/services/errors/product-error";

export function createPublicError(error: ProductError) {
  return toPublicError(error);
}
