import Fastify from "fastify";
import { ZodError } from "zod";
import { apiErrorsTotal, httpRequestDurationMs, httpRequestsTotal } from "./lib/observability";
import { appPlugins } from "./plugins/index";
import { registerRoutes } from "./routes/index";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport: process.env.NODE_ENV === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true }
          }
    },
    bodyLimit: 1024 * 64,
    requestTimeout: 10_000
  });

  await app.register(appPlugins);

  app.addHook("onRequest", async (request) => {
    request.metricsStartAt = performance.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url || request.url || "unknown";
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode)
    };
    httpRequestsTotal.inc(labels);
    if (typeof request.metricsStartAt === "number") {
      httpRequestDurationMs.observe(labels, performance.now() - request.metricsStartAt);
    }
  });

  await registerRoutes(app);

  app.setErrorHandler((reason, _request, reply) => {
    if (reason instanceof ZodError) {
      apiErrorsTotal.inc({ type: "validation" });
      return reply.code(400).send({ error: { message: "Validation error", details: reason.flatten() } });
    }

    apiErrorsTotal.inc({ type: "unhandled" });
    app.log.error({ reason }, "unhandled error");
    return reply.code(500).send({ error: { message: "Internal server error" } });
  });

  return app;
}
