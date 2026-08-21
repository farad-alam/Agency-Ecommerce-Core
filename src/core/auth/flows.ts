import { db } from "@/lib/db";
import { Errors } from "@/core/errors";
import { RegisterInput, ForgotPasswordInput, ResetPasswordInput, InviteStaffInput, AcceptInviteInput } from "./types";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import * as React from "react";
import { sendEmail } from "@/lib/email";
import { PasswordResetEmail } from "@/components/emails/password-reset";
import { StaffInviteEmail } from "@/components/emails/staff-invite";
import { env } from "@/lib/env";

export async function registerUser(input: RegisterInput, sessionId?: string) {
  const existingUser = await db.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw Errors.conflict("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  // We use a transaction to safely create the user and migrate the guest cart
  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        name: input.name,
        role: "CUSTOMER",
      },
    });

    if (sessionId) {
      // Find guest cart
      const guestCart = await tx.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });

      if (guestCart && guestCart.items.length > 0) {
        // Link guest cart to new user
        await tx.cart.update({
          where: { id: guestCart.id },
          data: { 
            userId: newUser.id,
            sessionId: null, // Clear sessionId so it becomes a strict user cart
          },
        });
      }
      
      // We can also link guest orders if they match the email
      await tx.order.updateMany({
        where: { guestEmail: input.email, userId: null },
        data: { userId: newUser.id },
      });
    }

    return newUser;
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function generatePasswordResetToken(input: ForgotPasswordInput) {
  const user = await db.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    // We return silently to prevent email enumeration
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send email via Resend
  const resetLink = `${env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    react: React.createElement(PasswordResetEmail, { 
      userFirstname: user.name || "Customer", 
      resetPasswordLink: resetLink 
    }),
  });

  return token;
}

export async function resetPassword(input: ResetPasswordInput) {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token: input.token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw Errors.businessRule("Invalid or expired reset token", "TOKEN_INVALID");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashedPassword },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
  });

  return true;
}

export async function inviteStaff(input: InviteStaffInput, inviterId: string) {
  const existingUser = await db.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw Errors.conflict("User with this email already exists");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days valid

  const invite = await db.staffInvite.create({
    data: {
      email: input.email,
      role: input.role,
      token,
      expiresAt,
      invitedBy: inviterId,
    },
  });

  // Send email via Resend
  const inviteLink = `${env.NEXT_PUBLIC_SITE_URL}/invite?token=${token}`;
  await sendEmail({
    to: input.email,
    subject: "You've been invited to join the store dashboard",
    react: React.createElement(StaffInviteEmail, { 
      role: input.role, 
      inviteLink: inviteLink 
    }),
  });

  return invite;
}

export async function acceptStaffInvite(input: AcceptInviteInput) {
  const invite = await db.staffInvite.findUnique({
    where: { token: input.token },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw Errors.businessRule("Invalid or expired invite token", "TOKEN_INVALID");
  }

  const existingUser = await db.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    throw Errors.conflict("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await db.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: invite.email,
        name: input.name,
        passwordHash: hashedPassword,
        role: invite.role,
      },
    });

    await tx.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return newUser;
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
