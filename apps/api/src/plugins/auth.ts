import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { error } from "../lib/response";

export const authPlugin = fp(async (app) => {
  app.decorateRequest("authUser");

  app.decorate("authenticate", async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const payload = await request.jwtVerify<{ sub: string }>();
      const user = await app.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return error(reply, 401, "Unauthorized");
      request.authUser = user;
    } catch {
      return error(reply, 401, "Unauthorized");
    }
  });

  app.decorate("requireAdmin", async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    if (!request.authUser || request.authUser.role !== "ADMIN") {
      return error(reply, 403, "Admin access required");
    }
  });
});
