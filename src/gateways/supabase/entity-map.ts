import {
  extensionReadyEntities,
  preservedEntities,
  type SchemaEntityName,
} from "@/gateways/supabase/schema-baseline";

type EntityLifecycle = "preserved" | "extension-ready";

export type EntityBaselineRecord = {
  name: SchemaEntityName;
  lifecycle: EntityLifecycle;
};

const extensionReadySet = new Set<string>(extensionReadyEntities);

export const entityMap: EntityBaselineRecord[] = preservedEntities.map((name) => ({
  name,
  lifecycle: extensionReadySet.has(name) ? "extension-ready" : "preserved",
}));
