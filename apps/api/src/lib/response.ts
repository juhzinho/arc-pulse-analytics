import type { FastifyReply } from "fastify";

export function ok<T>(reply: FastifyReply, data: T, meta?: Record<string, unknown>) {
  return reply.send({ data, meta });
}

export function error(reply: FastifyReply, statusCode: number, message: string, details?: unknown) {
  return reply.code(statusCode).send({
    error: {
      message,
      details
    }
  });
}
