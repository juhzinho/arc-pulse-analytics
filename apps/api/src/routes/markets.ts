import { createMarketSchema, marketListQuerySchema, marketPredictionSchema } from "@arc-pulse/shared";
import type { FastifyInstance } from "fastify";
import { getClientIp } from "../lib/auth";
import { error, ok } from "../lib/response";
import { createMarket, listMarkets, predictMarket, resolveMarket } from "../services/markets.service";

export async function marketsRoutes(app: FastifyInstance) {
  app.get("/markets", async (request, reply) => {
    const parsed = marketListQuerySchema.safeParse(request.query);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await listMarkets(app, parsed.data.status));
  });

  app.get("/markets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await app.prisma.market.findUnique({
      where: { id },
      include: { result: true, predictions: true }
    });
    if (!market) return error(reply, 404, "Market not found");
    return ok(reply, market);
  });

  app.post("/markets", {
    preHandler: [app.authenticate, app.requireAdmin]
  }, async (request, reply) => {
    const parsed = createMarketSchema.safeParse(request.body);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    return ok(reply, await createMarket(app, request.authUser!.id, getClientIp(request), parsed.data));
  });

  app.post("/markets/:id/predict", {
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const parsed = marketPredictionSchema.safeParse(request.body);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());
    const { id } = request.params as { id: string };
    try {
      return ok(reply, await predictMarket(app, id, request.authUser!.id, parsed.data));
    } catch (reason) {
      return error(reply, 400, reason instanceof Error ? reason.message : "Prediction failed");
    }
  });

  app.post("/markets/:id/resolve", {
    preHandler: [app.authenticate, app.requireAdmin]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const market = await resolveMarket(app, id, request.authUser!.id, getClientIp(request));
    if (!market) return error(reply, 404, "Market not found or already resolved");
    return ok(reply, market);
  });

  app.get("/leaderboard", async (request, reply) => {
    const period = ((request.query as { period?: string }).period ?? "7d");
    const snapshots = await app.prisma.leaderboardSnapshot.findMany({
      where: { period },
      include: { user: true },
      orderBy: { score: "asc" },
      take: 50
    });
    return ok(reply, snapshots);
  });
}
