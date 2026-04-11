import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { managedStreamMessage, managedGetMessages } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const maxDuration = 300;

export const POST = withTeacherRoute(async (ctx, req) => {
  const client = createAnthropicClient();
  const gateway = createTeaConsultantGateway(client, getAgentConfig());
  return managedStreamMessage(ctx, req, gateway, client);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
  return managedGetMessages(ctx, req, gateway);
});
