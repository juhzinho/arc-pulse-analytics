import type { PrismaClient, Prisma } from "@prisma/client";

export async function writeAuditLog(
  prisma: PrismaClient,
  input: {
    actorId?: string;
    action: string;
    entity: string;
    entityId: string;
    ip?: string;
    payload?: Record<string, unknown>;
  }
) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ip: input.ip,
      payload: input.payload as Prisma.InputJsonValue | undefined,
      ...(input.actorId ? { actorId: input.actorId } : {})
    }
  });
}
