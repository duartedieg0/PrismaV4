export type ConsultantBackend = "mastra" | "managed";

export function getConsultantBackend(): ConsultantBackend {
  return process.env.CONSULTANT_BACKEND === "managed" ? "managed" : "mastra";
}
