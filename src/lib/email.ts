import { Resend } from "resend";
import { env } from "@/lib/env";

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY);

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement; // The React email template
};

export async function sendEmail(options: SendEmailOptions) {
  try {
    const data = await resend.emails.send({
      from: "Agency Ecommerce <no-reply@agencyecommerce.com>", // Usually configured domain
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    return { success: true, data };
  } catch (error) {
    console.error("[Email Error]", error);
    return { success: false, error };
  }
}
