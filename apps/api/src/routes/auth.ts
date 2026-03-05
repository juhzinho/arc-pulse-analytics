import { loginSchema, verifySchema } from "@arc-pulse/shared";
import type { FastifyInstance } from "fastify";
import { getClientIp } from "../lib/auth";
import { ok, error } from "../lib/response";
import { createSessionToken } from "../lib/auth";
import { issueMagicLink, verifyMagicLink } from "../services/auth.service";
import { writeAuditLog } from "../services/audit.service";
import { sendMagicLinkEmail } from "../services/mail.service";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/request", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());

    const { token, user } = await issueMagicLink(app.prisma, parsed.data.email, app.config.ADMIN_EMAILS);
    const emailSent = await sendMagicLinkEmail(app, {
      email: parsed.data.email,
      token
    });

    await writeAuditLog(app.prisma, {
      actorId: user.id,
      action: "auth.request_magic_link",
      entity: "User",
      entityId: user.id,
      ip: getClientIp(request)
    });

    return ok(reply, {
      message: emailSent ? "Magic link sent" : "Magic link issued",
      ...(app.config.NODE_ENV !== "production" ? { token } : {})
    });
  });

  app.post("/auth/verify", async (request, reply) => {
    const parsed = verifySchema.safeParse(request.body);
    if (!parsed.success) return error(reply, 400, "Invalid input", parsed.error.flatten());

    const user = await verifyMagicLink(app.prisma, parsed.data.email, parsed.data.token);
    if (!user) return error(reply, 401, "Invalid or expired token");

    const jwt = await createSessionToken(request, user);
    return ok(reply, { token: jwt, user });
  });
}
