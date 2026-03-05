import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client/index.js";

export const apiMetricsRegistry = new Registry();

collectDefaultMetrics({
  register: apiMetricsRegistry,
  prefix: "arc_pulse_api_"
});

export const httpRequestDurationMs = new Histogram({
  name: "arc_pulse_api_http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [apiMetricsRegistry]
});

export const httpRequestsTotal = new Counter({
  name: "arc_pulse_api_http_requests_total",
  help: "Total HTTP requests served",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [apiMetricsRegistry]
});

export const apiErrorsTotal = new Counter({
  name: "arc_pulse_api_errors_total",
  help: "Total API errors by type",
  labelNames: ["type"] as const,
  registers: [apiMetricsRegistry]
});

export const sseConnectionsGauge = new Gauge({
  name: "arc_pulse_api_sse_connections",
  help: "Active SSE metric stream connections",
  registers: [apiMetricsRegistry]
});

export const healthStatusGauge = new Gauge({
  name: "arc_pulse_api_dependency_health",
  help: "Dependency health status where 1=healthy and 0=unhealthy",
  labelNames: ["dependency"] as const,
  registers: [apiMetricsRegistry]
});
