import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { confirmMediaUpload } from "@/core/media";
import { handleError } from "@/core/errors/handler";
import { parseBody } from "@/core/api/validate";
import { confirmMediaSchema } from "@/core/api/schemas";

export async function POST(req: Request) {
  try {
    await requireDashboardAccess();
    const body = await req.json();
    const parsed = parseBody(confirmMediaSchema, body);
    if ("error" in parsed) return parsed.error;
    const media = await confirmMediaUpload(parsed.data);
    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
