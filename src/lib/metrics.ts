type MetricEntry = {
  metric: string;
  endpoint: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
};

export function recordApiLatency(
  endpoint: string,
  method: string,
  status: number,
  durationMs: number,
) {
  const entry: MetricEntry = {
    metric: "api.latency",
    endpoint,
    method,
    status,
    durationMs,
    timestamp: Date.now(),
  };
  console.log(JSON.stringify(entry));
}

export function recordApiError(
  endpoint: string,
  method: string,
  status: number,
) {
  console.log(
    JSON.stringify({
      metric: "api.error",
      endpoint,
      method,
      status,
      timestamp: Date.now(),
    }),
  );
}
