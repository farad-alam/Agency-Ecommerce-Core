import { z } from "zod";
import { NextResponse } from "next/server";

export function parseBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data };
}

export function parseQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { data: T } | { error: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries());
  return parseBody(schema, raw);
}
