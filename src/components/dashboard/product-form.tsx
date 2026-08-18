"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, X, ImageIcon, RotateCcw, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import type { Brand, Category } from "@prisma/client";
import type { ProductFull } from "@/app/(dashboard)/dashboard/products/[id]/page";
import { toast } from "sonner";
import Link from "next/link";
import { storeConfig } from "@/config/store.config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  product?: ProductFull;
  brands: Brand[];
  categories: Category[];
}

interface VariantOption {
  key: string;
  value: string;
}

interface VariantState {
  id?: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  inventoryQty: string;
  weightGrams: string;
  barcode: string;
  options: VariantOption[];
  skuLocked: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateSku(title: string, options: VariantOption[]): string {
  if (!title) return "";
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 5);
  const optVals = options
    .map((o) => o.value.trim())
    .filter(Boolean)
    .map((v) => v.toUpperCase().replace(/\s+/g, "").slice(0, 4))
    .join("-");
  return optVals ? `${initials}-${optVals}` : `${initials}-001`;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳", USD: "$", EUR: "€", GBP: "£", INR: "₹",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RequiredDot() {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 ml-1 align-middle"
      title="Required"
    />
  );
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="block text-[13px] font-medium text-zinc-200">
        {children}
        {required && <RequiredDot />}
      </label>
      {hint && <p className="text-[11px] text-zinc-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
  symbol,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  symbol: string;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium pointer-events-none">
        {symbol}
      </span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-8 pr-4 rounded-xl border border-white/[0.09] bg-[#111113] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductForm({ product, brands, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingAs, setSavingAs] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!product;
  const currencySymbol = CURRENCY_SYMBOLS[storeConfig.currency] ?? "$";

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">(
    (product?.status as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT"
  );
  const [brandId, setBrandId] = useState(product?.brandId ?? "none");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.categoryId) ?? []
  );
  const [showVariants, setShowVariants] = useState(
    !!product && product.variants.length > 1
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ─── Variant State ───────────────────────────────────────────────────────────
  const [variants, setVariants] = useState<VariantState[]>(
    product?.variants.map((v) => {
      const optsArray: VariantOption[] = [];
      if (v.options && typeof v.options === "object") {
        Object.entries(v.options as Record<string, string>).forEach(([k, val]) =>
          optsArray.push({ key: k, value: val })
        );
      }
      if (!optsArray.length) optsArray.push({ key: "", value: "" });
      return {
        id: v.id,
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
        inventoryQty: String(v.inventoryQty),
        weightGrams: v.weightGrams ? String(v.weightGrams) : "",
        barcode: v.barcode || "",
        options: optsArray,
        skuLocked: true,
      };
    }) ?? [
      { sku: "", price: "", compareAtPrice: "", inventoryQty: "0", weightGrams: "", barcode: "", options: [{ key: "", value: "" }], skuLocked: false },
    ]
  );

  // ─── Auto-generate SKU on title change ──────────────────────────────────────
  useEffect(() => {
    if (!title) return;
    setVariants((prev) =>
      prev.map((v) =>
        !v.skuLocked && !v.id ? { ...v, sku: generateSku(title, showVariants ? v.options : []) } : v
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
  }

  function updateVariant(i: number, field: keyof VariantState, value: string | VariantOption[] | boolean) {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== i) return v;
        const updated = { ...v, [field]: value };
        if (field === "sku") updated.skuLocked = true;
        return updated;
      })
    );
  }

  function resetSku(i: number) {
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i ? { ...v, sku: generateSku(title, showVariants ? v.options : []), skuLocked: false } : v
      )
    );
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      { sku: generateSku(title, []), price: prev[0]?.price || "", compareAtPrice: "", inventoryQty: "0", weightGrams: "", barcode: "", options: [{ key: "", value: "" }], skuLocked: false },
    ]);
  }

  function removeVariantRow(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateOption(vi: number, oi: number, field: "key" | "value", val: string) {
    const variant = variants[vi];
    const newOpts = variant.options.map((o, idx) => idx === oi ? { ...o, [field]: val } : o);
    const updated = { ...variant, options: newOpts };
    if (!variant.skuLocked && !variant.id) updated.sku = generateSku(title, newOpts);
    setVariants((prev) => prev.map((v, idx) => idx === vi ? updated : v));
  }

  function addOption(vi: number) {
    const opts = [...variants[vi].options, { key: "", value: "" }];
    updateVariant(vi, "options", opts);
  }

  function removeOption(vi: number, oi: number) {
    const opts = variants[vi].options.filter((_, idx) => idx !== oi);
    updateVariant(vi, "options", opts);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  async function handleSave(saveStatus: "DRAFT" | "ACTIVE" | "ARCHIVED") {
    setError(null);
    setSavingAs(saveStatus);

    const hasValidVariant = variants.some((v) => v.sku.trim());
    if (!hasValidVariant) {
      setError("At least one variant with a valid SKU is required.");
      setSavingAs(null);
      return;
    }

    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        status: isEditing ? status : (saveStatus === "ARCHIVED" ? "DRAFT" : saveStatus),
        brandId: brandId === "none" ? null : brandId,
        categoryIds: selectedCategoryIds,
      };

      let productId = product?.id;

      if (isEditing) {
        const res = await fetch(`/api/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, status }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
        productId = (await res.json()).id;
      }

      for (const variant of variants) {
        if (!variant.sku.trim()) continue;
        const optionsObj = showVariants
          ? variant.options.reduce((acc, o) => {
              if (o.key.trim() && o.value.trim()) acc[o.key.trim()] = o.value.trim();
              return acc;
            }, {} as Record<string, string>)
          : {};

        const payload = {
          sku: variant.sku.trim(),
          price: parseFloat(variant.price) || 0,
          compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice) : undefined,
          inventoryQty: parseInt(variant.inventoryQty) || 0,
          weightGrams: variant.weightGrams ? parseInt(variant.weightGrams) : undefined,
          barcode: variant.barcode.trim() || undefined,
          options: optionsObj,
        };

        if (variant.id) {
          await fetch(`/api/products/${productId}/variants/${variant.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(`/api/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }

      // Auto-inherit SEO from title/description
      const metaTitle = title.trim().slice(0, 70);
      const metaDescription = description.trim().replace(/(<([^>]+)>)/gi, "").slice(0, 160);
      if (metaTitle || metaDescription) {
        await fetch(`/api/products/${productId}/seo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metaTitle, metaDescription }),
        });
      }

      toast.success(
        isEditing
          ? "Product saved!"
          : saveStatus === "ACTIVE"
          ? "Product published to your store!"
          : "Draft saved. You can publish it later."
      );

      startTransition(() => {
        if (!isEditing) router.push(`/dashboard/products/${productId}`);
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSavingAs(null);
    }
  }

  const isSaving = !!savingAs || isPending;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#0f0f10]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.09] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">
              {isEditing ? product.title : "Add New Product"}
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isEditing
                ? `Last updated ${product.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "Fill in the details below"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <p className="text-xs text-rose-400 max-w-xs truncate">{error}</p>
          )}
          {isEditing ? (
            <>
              <button
                onClick={() => router.push("/dashboard/products")}
                className="h-9 px-4 rounded-xl border border-white/[0.09] text-sm text-zinc-400 hover:text-white hover:bg-white/[0.04] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(status)}
                disabled={isSaving || !title.trim()}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium text-white flex items-center gap-2 transition"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave("DRAFT")}
                disabled={isSaving || !title.trim()}
                className="h-9 px-4 rounded-xl border border-white/[0.09] bg-white/[0.02] text-sm text-zinc-300 hover:bg-white/[0.06] disabled:opacity-50 flex items-center gap-2 transition"
              >
                {savingAs === "DRAFT" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave("ACTIVE")}
                disabled={isSaving || !title.trim()}
                className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-medium text-white flex items-center gap-2 transition"
              >
                {savingAs === "ACTIVE" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                ● Publish
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Body ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">

          {/* ── Left Panel: Media & Visibility ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Cover Image */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Product Images</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">The first image becomes the cover photo</p>
              </div>

              {!isEditing ? (
                <div className="p-6">
                  <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/[0.1] bg-black/20 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:border-indigo-500/40 hover:text-zinc-400 transition cursor-pointer">
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-zinc-400">Add images after saving</p>
                      <p className="text-xs text-zinc-600 mt-0.5">Create the product first, then upload photos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {product.media.length > 0 ? (
                    <>
                      {/* Cover image */}
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/40 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.media[0].url}
                          alt={product.media[0].alt ?? product.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg">Cover Photo</span>
                        </div>
                      </div>
                      {/* Thumbnails */}
                      {product.media.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {product.media.slice(1, 4).map((m) => (
                            <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-black/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.url} alt={m.alt ?? ""} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          <Link
                            href={`/dashboard/products/${product.id}/media`}
                            className="aspect-square rounded-lg border-2 border-dashed border-white/[0.1] bg-black/20 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-indigo-500/40 transition"
                          >
                            <Plus className="h-5 w-5" />
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/[0.1] bg-black/20 flex flex-col items-center justify-center gap-3 text-zinc-500">
                      <ImageIcon className="h-8 w-8" />
                      <p className="text-sm">No images yet</p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/products/${product.id}/media`}
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-white/[0.09] bg-white/[0.02] text-sm text-zinc-300 hover:bg-white/[0.06] transition"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Manage Images
                  </Link>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] p-5">
              <h2 className="text-sm font-semibold text-white">Visibility</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5 mb-4">Control whether customers can see this product</p>

              {isEditing ? (
                <div className="flex rounded-xl border border-white/[0.09] bg-black/20 p-1 gap-1">
                  {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => {
                    const labels: Record<string, string> = { ACTIVE: "● Live", DRAFT: "Hidden", ARCHIVED: "Archived" };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                          status === s
                            ? s === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {labels[s]}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex rounded-xl border border-white/[0.09] bg-black/20 p-1 gap-1">
                  <div className="flex-1 py-2 rounded-lg text-xs font-medium text-center text-zinc-500 border border-transparent">
                    ○ Hidden
                  </div>
                  <div className="flex-1 py-2 rounded-lg text-xs font-medium text-center bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    ● Published
                  </div>
                </div>
              )}
              <p className="text-[11px] text-zinc-600 mt-3">
                {isEditing
                  ? status === "ACTIVE" ? "This product is live and visible to customers." : "This product is currently hidden from customers."
                  : "Use the buttons above to choose Draft or Publish when saving."}
              </p>
            </div>
          </div>

          {/* ── Right Panel: Product Details ─────────────────────────────────── */}
          <div className="space-y-4">

            {/* Product Details Card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-semibold text-white">Product Details</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Key info to describe and display your product</p>
                </div>
                {/* General / Advanced toggle */}
                <div className="flex rounded-lg border border-white/[0.09] bg-black/20 p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${!showAdvanced ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    General
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${showAdvanced ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                    {error}
                  </div>
                )}

                {!showAdvanced ? (
                  <>
                    {/* Product Name */}
                    <div>
                      <FieldLabel required hint="This is what customers will see on your store">Product Name</FieldLabel>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="e.g. Classic Cotton Tee, Vanilla Scented Candle"
                        className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      />
                    </div>

                    {/* Brand + Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel hint="The maker or manufacturer">Brand</FieldLabel>
                        <select
                          value={brandId}
                          onChange={(e) => setBrandId(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition appearance-none"
                          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
                        >
                          <option value="none">No brand</option>
                          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel hint="Click to select multiple">Category</FieldLabel>
                        <div className="flex flex-wrap gap-1.5 min-h-12 items-center px-3 py-2 rounded-xl border border-white/[0.09] bg-[#111113]">
                          {categories.length === 0 ? (
                            <span className="text-xs text-zinc-600">No categories</span>
                          ) : (
                            categories.map((cat) => {
                              const sel = selectedCategoryIds.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setSelectedCategoryIds((p) => sel ? p.filter((id) => id !== cat.id) : [...p, cat.id])}
                                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition border ${sel ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:text-zinc-300"}`}
                                >
                                  {cat.name}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required hint="The amount customers pay">Selling Price</FieldLabel>
                        <PriceInput
                          value={variants[0]?.price ?? ""}
                          onChange={(v) => updateVariant(0, "price", v)}
                          placeholder="0.00"
                          symbol={currencySymbol}
                        />
                      </div>
                      <div>
                        <FieldLabel hint="Leave blank if not on sale">Original Price (Was)</FieldLabel>
                        <PriceInput
                          value={variants[0]?.compareAtPrice ?? ""}
                          onChange={(v) => updateVariant(0, "compareAtPrice", v)}
                          placeholder="Leave blank if no sale"
                          symbol={currencySymbol}
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div>
                      <FieldLabel required hint="How many units do you currently have available?">Stock Count</FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={variants[0]?.inventoryQty ?? "0"}
                        onChange={(e) => updateVariant(0, "inventoryQty", e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <FieldLabel hint="Describe the product — materials, benefits, who it's for">Description</FieldLabel>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell customers what makes this product special..."
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-white/[0.09] bg-[#111113] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition resize-none"
                      />
                    </div>

                    {/* Auto SKU display */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/20 border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-500">SKU:</span>
                        <span className="font-mono text-[11px] text-zinc-300">{variants[0]?.sku || "Auto-generated when you type the name"}</span>
                        {variants[0]?.skuLocked && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Custom</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => resetSku(0)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
                      >
                        <RotateCcw className="h-3 w-3" /> Regenerate
                      </button>
                    </div>

                    {/* Variants toggle */}
                    <div className="pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setShowVariants((v) => !v)}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${showVariants ? "bg-indigo-500 border-indigo-500" : "border-white/[0.2] bg-white/[0.02]"}`}>
                          {showVariants && (
                            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-200">This product has sizes, colors, or other options</p>
                          <p className="text-[11px] text-zinc-500">Check this if your product comes in different variations</p>
                        </div>
                      </button>
                    </div>
                  </>
                ) : (
                  /* ─── Advanced Panel ────────────────────────────────────────── */
                  <div className="space-y-5">
                    <div>
                      <FieldLabel hint="The URL link for this product page — auto-generated from the name">URL Slug</FieldLabel>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="classic-cotton-tee"
                        className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                      />
                      <p className="text-[11px] text-zinc-600 mt-1">Only change this if you need a specific web address. Changing it will break existing links.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel hint="Used for shipping cost calculation">Shipping Weight (grams)</FieldLabel>
                        <input
                          type="number"
                          min={0}
                          value={variants[0]?.weightGrams ?? ""}
                          onChange={(e) => updateVariant(0, "weightGrams", e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        />
                      </div>
                      <div>
                        <FieldLabel hint="Barcode, UPC, or GTIN if you have one">Barcode</FieldLabel>
                        <input
                          type="text"
                          value={variants[0]?.barcode ?? ""}
                          onChange={(e) => updateVariant(0, "barcode", e.target.value)}
                          placeholder="Optional"
                          className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Variants Section ──────────────────────────────────────────── */}
            {showVariants && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Product Variations</h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Each row = one variation (e.g. Size S, Size M, Size L)</p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.09] bg-white/[0.03] text-xs font-medium text-zinc-300 hover:bg-white/[0.07] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Variation
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {variants.map((v, vi) => (
                    <div key={v.id || vi} className="rounded-xl border border-white/[0.07] bg-black/20 p-5 space-y-4 relative">
                      {!v.id && variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(vi)}
                          className="absolute top-4 right-4 text-zinc-600 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Attributes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <FieldLabel>Attributes (e.g. Size → Medium, Color → Blue)</FieldLabel>
                          <button
                            type="button"
                            onClick={() => addOption(vi)}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        </div>
                        <div className="space-y-2">
                          {v.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                value={opt.key}
                                onChange={(e) => updateOption(vi, oi, "key", e.target.value)}
                                placeholder="Attribute (e.g. Size)"
                                className="flex-1 h-9 px-3 rounded-lg border border-white/[0.09] bg-[#111113] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition"
                              />
                              <input
                                value={opt.value}
                                onChange={(e) => updateOption(vi, oi, "value", e.target.value)}
                                placeholder="Value (e.g. Medium)"
                                className="flex-1 h-9 px-3 rounded-lg border border-white/[0.09] bg-[#111113] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition"
                              />
                              {v.options.length > 1 && (
                                <button type="button" onClick={() => removeOption(vi, oi)} className="text-zinc-600 hover:text-rose-400 transition">
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price / Stock */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <FieldLabel required>Price</FieldLabel>
                          <PriceInput value={v.price} onChange={(val) => updateVariant(vi, "price", val)} placeholder="0.00" symbol={currencySymbol} />
                        </div>
                        <div>
                          <FieldLabel>Original Price</FieldLabel>
                          <PriceInput value={v.compareAtPrice} onChange={(val) => updateVariant(vi, "compareAtPrice", val)} placeholder="Was…" symbol={currencySymbol} />
                        </div>
                        <div>
                          <FieldLabel required>Stock</FieldLabel>
                          <input
                            type="number" min={0}
                            value={v.inventoryQty}
                            onChange={(e) => updateVariant(vi, "inventoryQty", e.target.value)}
                            placeholder="0"
                            className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                          />
                        </div>
                      </div>

                      {/* SKU */}
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-black/20 border border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">SKU</span>
                          <span className="font-mono text-[11px] text-zinc-300">{v.sku || "Auto-generated"}</span>
                          {v.skuLocked && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 rounded">Custom</span>}
                        </div>
                        <button type="button" onClick={() => resetSku(vi)} className="text-[10px] text-zinc-600 hover:text-zinc-300 flex items-center gap-1 transition">
                          <RotateCcw className="h-2.5 w-2.5" /> Reset
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
