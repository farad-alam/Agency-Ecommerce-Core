import { cloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { Errors } from "@/core/errors";

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  eager: string;
}

/**
 * Generates a signed upload preset for direct client-to-Cloudinary upload.
 * The signature prevents unauthorized uploads to your account.
 */
export async function getSignedUploadParams(
  folder = "products"
): Promise<SignedUploadParams> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const eager = "c_limit,w_1200,q_auto,f_auto";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, eager },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
    eager,
  };
}

/**
 * Called after a successful Cloudinary upload to save the media record to the DB.
 */
export async function confirmMediaUpload(data: {
  cloudinaryId: string;
  url: string;
  alt?: string;
  productId?: string;
  position?: number;
}) {
  return db.media.create({ data });
}

export async function getMediaById(id: string) {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) throw Errors.notFound("Media");
  return media;
}

export async function listMedia(productId?: string) {
  return db.media.findMany({
    where: productId ? { productId } : {},
    orderBy: [{ productId: "asc" }, { position: "asc" }],
  });
}

export async function updateMediaPosition(id: string, position: number) {
  return db.media.update({ where: { id }, data: { position } });
}

export async function deleteMedia(id: string) {
  const media = await getMediaById(id);
  // Delete from Cloudinary
  await cloudinary.uploader.destroy(media.cloudinaryId);
  // Delete from DB
  await db.media.delete({ where: { id } });
}

export async function reorderProductMedia(
  productId: string,
  orderedMediaIds: string[]
) {
  await db.$transaction(
    orderedMediaIds.map((id, index) =>
      db.media.update({ where: { id }, data: { position: index } })
    )
  );
}
