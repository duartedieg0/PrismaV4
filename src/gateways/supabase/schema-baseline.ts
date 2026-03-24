export const preservedEntities = [
  "profiles",
  "ai_models",
  "agents",
  "supports",
  "subjects",
  "grade_levels",
  "exams",
  "exam_supports",
  "questions",
  "adaptations",
  "feedbacks",
  "agent_evolutions",
  "admin_audit_logs",
] as const;

export const extensionReadyEntities = [
  "exams",
  "questions",
  "adaptations",
  "agent_evolutions",
] as const;

export type SchemaEntityName = (typeof preservedEntities)[number];

export const schemaBaseline = {
  migrationIds: [
    "00001_initial_schema",
    "00002_rls_policies",
    "00003_triggers_and_indexes",
    "00004_storage",
    "00005_default_model",
    "00006_feedback_dismissed",
    "00007_adapted_alternatives",
    "00008_backfill_existing_profiles",
    "00009_admin_configuration_governance",
    "00010_admin_user_audit",
    "00011_agent_evolution_versioning",
    "00012_grant_table_permissions",
  ],
  phase41Contracts: {
    profiles: [
      "id",
      "full_name",
      "email",
      "avatar_url",
      "role",
      "blocked",
      "created_at",
    ],
    subjects: ["id", "name", "enabled", "created_at"],
    gradeLevels: ["id", "name", "enabled", "created_at"],
    exams: [
      "id",
      "user_id",
      "subject_id",
      "grade_level_id",
      "topic",
      "pdf_path",
      "status",
      "error_message",
      "created_at",
      "updated_at",
    ],
  },
  phase41CompatibilityMigration: "00008_backfill_existing_profiles",
} as const;
