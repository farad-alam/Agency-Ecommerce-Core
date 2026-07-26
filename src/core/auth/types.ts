import { z } from "zod";

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordInputSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const InviteStaffInputSchema = z.object({
  email: z.string().email(),
  role: z.enum(["STAFF", "ADMIN"]),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
export type InviteStaffInput = z.infer<typeof InviteStaffInputSchema>;
