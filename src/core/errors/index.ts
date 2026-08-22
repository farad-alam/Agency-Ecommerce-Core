export const ErrorCode = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",

  // Business logic
  COUPON_INVALID: "COUPON_INVALID",
  COUPON_EXPIRED: "COUPON_EXPIRED",
  COUPON_NOT_STARTED: "COUPON_NOT_STARTED",
  COUPON_USAGE_LIMIT: "COUPON_USAGE_LIMIT",
  COUPON_MIN_SUBTOTAL: "COUPON_MIN_SUBTOTAL",
  INVENTORY_INSUFFICIENT: "INVENTORY_INSUFFICIENT",
  CART_EMPTY: "CART_EMPTY",
  GUEST_CHECKOUT_DISABLED: "GUEST_CHECKOUT_DISABLED",
  PAYMENT_PROVIDER_INVALID: "PAYMENT_PROVIDER_INVALID",
  DUPLICATE_TRANSACTION_ID: "DUPLICATE_TRANSACTION_ID",
  SHIPPING_ZONE_NOT_COVERED: "SHIPPING_ZONE_NOT_COVERED",
  SHIPPING_RATE_NOT_FOUND: "SHIPPING_RATE_NOT_FOUND",

  // Infrastructure
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code: ErrorCode,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (message = "Unauthorized") =>
    new AppError(message, 401, ErrorCode.UNAUTHORIZED),

  forbidden: (message = "Forbidden") =>
    new AppError(message, 403, ErrorCode.FORBIDDEN),

  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, ErrorCode.NOT_FOUND),

  conflict: (message: string) =>
    new AppError(message, 409, ErrorCode.CONFLICT),

  validation: (details: Record<string, string[]>) =>
    new AppError("Validation failed", 400, ErrorCode.VALIDATION_ERROR, details),

  businessRule: (message: string, code: ErrorCode) =>
    new AppError(message, 422, code),

  inventoryInsufficient: (variantId: string, available: number) =>
    new AppError("Insufficient inventory", 409, ErrorCode.INVENTORY_INSUFFICIENT, {
      variantId: [`Only ${available} units available`],
    }),

  internal: () =>
    new AppError("An unexpected error occurred", 500, ErrorCode.INTERNAL_ERROR),
} as const;

export * from "./handler";
