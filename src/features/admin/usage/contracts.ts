export type AdminUsageUser = {
  userId: string;
  name: string | null;
  email: string | null;
  threadCount: number;
  estimatedCostUSD: number;
  lastActivityAt: string | null;
};

export type AdminUsageThread = {
  threadId: string;
  title: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCostUSD: number;
  updatedAt: string;
};

export type AdminUsageTotals = {
  sessions: number;
  estimatedCostUSD: number;
};

export type AdminUsageSummary = {
  totals: AdminUsageTotals;
  users: AdminUsageUser[];
};

export type AdminUsageUserDetail = {
  user: { name: string | null; email: string | null };
  threads: AdminUsageThread[];
};
