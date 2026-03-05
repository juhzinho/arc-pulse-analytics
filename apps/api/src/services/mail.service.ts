import type { FastifyInstance } from "fastify";
import { createTransport } from "nodemailer/lib/nodemailer.js";

function canSendMail(app: FastifyInstance) {
  return Boolean(app.config.SMTP_HOST && app.config.SMTP_USER && app.config.SMTP_PASS);
}

export async function sendMagicLinkEmail(
  app: FastifyInstance,
  input: { email: string; token: string }
) {
  if (!canSendMail(app)) {
    if (app.config.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    return false;
  }

  const transporter = createTransport({
    host: app.config.SMTP_HOST,
    port: app.config.SMTP_PORT,
    secure: app.config.SMTP_SECURE,
    auth: {
      user: app.config.SMTP_USER,
      pass: app.config.SMTP_PASS
    }
  });

  const url = new URL("/auth/verify", app.config.WEB_URL);
  url.searchParams.set("email", input.email);
  url.searchParams.set("token", input.token);

  await transporter.sendMail({
    from: app.config.SMTP_FROM,
    to: input.email,
    subject: "Your Arc Pulse sign-in link",
    text: `Sign in to Arc Pulse Analytics: ${url.toString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2>Arc Pulse Analytics</h2>
        <p>Use the link below to sign in:</p>
        <p><a href="${url.toString()}">Open your secure sign-in link</a></p>
        <p>This link expires in 15 minutes.</p>
      </div>
    `
  });

  return true;
}
