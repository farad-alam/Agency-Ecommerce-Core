import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MediaManager } from "@/components/dashboard/media-manager";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Manage Product Media" };

export default async function ManageProductMediaPage({ params }: Props) {
  const { id } = await params;
  
  const product = await db.product.findUnique({
    where: { id },
    include: {
      media: { orderBy: { position: "asc" } }
    }
  });

  if (!product) notFound();

  return (
    <MediaManager 
      productId={product.id}
      productTitle={product.title}
      initialMedia={product.media}
    />
  );
}
