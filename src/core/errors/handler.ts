import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./index";
import { logger } from "@/lib/logger";

export function handleError(error: unknown): NextResponse {
  // Known application error
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };

    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] ?? "field";
      return NextResponse.json(
        { error: `${field} already exists`, code: "CONFLICT" },
        { status: 409 }
      );
    }

    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { error: "Record not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
  }

  // Unknown error — log it, return generic message
  logger.error("Unhandled error", {
    name: (error as Error)?.name,
    message: (error as Error)?.message,
  });

  return NextResponse.json(
    { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

type RouteHandler = (
  req: Request,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

export function withHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleError(error);
    }
  };
}
