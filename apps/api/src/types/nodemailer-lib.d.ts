declare module "nodemailer/lib/nodemailer.js" {
  export function createTransport(options: unknown): {
    sendMail(input: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<unknown>;
  };
}
