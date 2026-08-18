import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/core/auth/helpers";
import { getSignedUploadParams } from "@/core/media";
import { handleError } from "@/core/errors/handler";

export async function GET(req: Request) {
  try {
    await requireDashboardAccess();
    const url = new URL(req.url);
    const folder = url.searchParams.get("folder") ?? "products";
    
    if (!process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Cloudinary API Secret is missing in environment variables.");
    }
    
    const params = await getSignedUploadParams(folder);
    return NextResponse.json(params);
  } catch (err) {
    return handleError(err);
  }
}
