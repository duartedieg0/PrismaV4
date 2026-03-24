import type { EnabledNameEntity } from "@/features/admin/shared/contracts";

export function toEnabledNameEntity(input: {
  id: string;
  name: string;
  enabled: boolean;
}): EnabledNameEntity {
  return {
    id: input.id,
    name: input.name,
    enabled: input.enabled,
  };
}
