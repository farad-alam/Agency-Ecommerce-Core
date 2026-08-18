"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, Loader2, Image as ImageIcon, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Media } from "@prisma/client";
import Link from "next/link";

interface Props {
  productId: string;
  productTitle: string;
  initialMedia: Media[];
}

export function MediaManager({ productId, productTitle, initialMedia }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Get signed URL params
      const res = await fetch(`/api/media/upload-url?folder=products`);
      if (!res.ok) throw new Error("Failed to get upload signature");
      const signatureParams = await res.json();

      const uploadedMedia: Media[] = [];

      for (const file of files) {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureParams.apiKey);
        formData.append("timestamp", signatureParams.timestamp.toString());
        formData.append("signature", signatureParams.signature);
        formData.append("folder", signatureParams.folder);
        if (signatureParams.eager) {
          formData.append("eager", signatureParams.eager);
        }

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureParams.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(`Cloudinary Error: ${errData?.error?.message || uploadRes.statusText}`);
        }
        const uploadData = await uploadRes.json();

        // Confirm upload with our API
        const confirmRes = await fetch("/api/media/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cloudinaryId: uploadData.public_id,
            url: uploadData.secure_url,
            productId,
          }),
        });

        if (!confirmRes.ok) {
          const errData = await confirmRes.json().catch(() => ({}));
          throw new Error(`API Error: ${errData?.error || confirmRes.statusText}`);
        }
        const confirmedMedia = await confirmRes.json();
        uploadedMedia.push(confirmedMedia);
      }

      setMedia((prev) => [...prev, ...uploadedMedia]);
      toast.success(`Successfully uploaded ${files.length} image(s)`);
      
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    setDeletingId(id);
    
    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete image");
      
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast.success("Image deleted");
      
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#0f0f10]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/products/${productId}`}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.09] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">Manage Images</h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">{productTitle}</p>
          </div>
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          
          {/* Upload Zone */}
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed border-white/[0.1] bg-[#1a1a1d] p-12 flex flex-col items-center justify-center gap-4 transition ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500/40 hover:bg-[#1a1a1d]/80 cursor-pointer'}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <div className="h-16 w-16 rounded-3xl bg-white/[0.04] flex items-center justify-center text-zinc-400">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                {isUploading ? "Uploading images..." : "Click to upload images"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {isUploading ? "Please wait" : "PNG, JPG up to 10MB"}
              </p>
            </div>
          </div>

          {/* Media Grid */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-semibold text-white">Product Images ({media.length})</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">The first image will be used as the primary cover photo.</p>
            </div>
            
            <div className="p-6">
              {media.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-500">
                  <ImageIcon className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {media.map((item, index) => (
                    <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-white/[0.07] bg-black/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={item.url} 
                        alt={item.alt || `Product image ${index + 1}`} 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-60"
                      />
                      
                      {index === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-indigo-500/90 backdrop-blur-sm rounded-md text-[10px] font-medium text-white shadow-sm pointer-events-none">
                          Cover
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={deletingId === item.id}
                        className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/60 backdrop-blur-sm text-zinc-300 hover:text-rose-400 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-100"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
