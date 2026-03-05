import { startTracing, stopTracing } from "./lib/tracing";
import { buildApp } from "./app";
import { env } from "./config/env";

await startTracing(process.env.OTEL_SERVICE_NAME ?? "arc-pulse-api");
const app = await buildApp();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await stopTracing();
    await app.close();
    process.exit(0);
  });
}

app.listen({ host: "0.0.0.0", port: env.PORT }).catch((reason) => {
  app.log.error({ reason }, "failed to start");
  process.exit(1);
});
