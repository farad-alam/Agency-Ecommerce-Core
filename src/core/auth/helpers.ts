import { auth } from "@/lib/auth";
import { Errors } from "@/core/errors";

/**
 * Returns the current session user or throws 401.
 * Use in API routes that require any authenticated user.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw Errors.unauthorized();
  }
  return session.user;
}

/**
 * Returns the current session user or throws 401/403.
 * Use in dashboard API routes (STAFF or ADMIN only).
 */
export async function requireDashboardAccess() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw Errors.forbidden("Dashboard access requires STAFF or ADMIN role");
  }
  return user;
}

/**
 * Returns the current session user or throws 401/403.
 * Use in ADMIN-only routes (invite staff, change settings, etc.).
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw Errors.forbidden("This action requires ADMIN role");
  }
  return user;
}

/**
 * Returns the current session user or null (no throw).
 * Use in routes that work for both guests and authenticated users.
 */
export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}
