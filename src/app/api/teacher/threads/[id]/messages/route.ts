import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraStreamMessage, mastraGetMessages } from "@/features/support/thread-handlers-mastra";
import { managedStreamMessage, managedGetMessages } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const maxDuration = 300;

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedStreamMessage(ctx, req, gateway);
  }
  return mastraStreamMessage(ctx, req);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedGetMessages(ctx, req, gateway);
  }
  return mastraGetMessages(ctx, req);
});
