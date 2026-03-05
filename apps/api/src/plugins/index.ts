import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyCompress from "@fastify/compress";
import fastifyJwt from "@fastify/jwt";
import fastifyRateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import { Queue } from "bullmq";
import { prisma } from "../lib/prisma";
import { createRedisClient } from "../lib/redis";
import { env } from "../config/env";
import { authPlugin } from "./auth";

export const appPlugins = fp(async (app) => {
  const redis = createRedisClient(env.REDIS_URL, app.log);
  const isTest = env.NODE_ENV === "test";
  const marketQueue = new Queue("market-resolution", {
    connection: redis as never,
    ...(isTest ? { skipVersionCheck: true } : {})
  });

  app.decorate("config", env);
  app.decorate("prisma", prisma);
  app.decorate("redis", redis);
  app.decorate("marketQueue", marketQueue);

  await app.register(sensible);
  await app.register(fastifyCors, {
    origin: env.ALLOWED_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"]
  });
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false
  });
  await app.register(fastifyCompress, {
    encodings: ["gzip", "br"]
  });
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });
  await app.register(fastifyRateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
    ...(isTest ? {} : { redis })
  });
  await app.register(authPlugin);

  app.addHook("onClose", async () => {
    await Promise.all([redis.quit(), prisma.$disconnect(), marketQueue.close()]);
  });
});
