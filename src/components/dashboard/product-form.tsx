"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, X, ImageIcon, RotateCcw, ArrowLeft } from "lucide-react";
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

/** One option group, e.g. {name:"Size", values:["S","M","XL"]} */
interface OptionGroup {
  name: string;
  values: string[];
}

/** Shared product state — price/stock apply to all variants */
interface SharedState {
  id?: string;          // id of the first/simple variant
  sku: string;
  price: string;
  compareAtPrice: string;
  inventoryQty: string;
  weightGrams: string;
  barcode: string;
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

function generateSku(title: string, combo: string[] = []): string {
  if (!title) return "";
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("")
    .slice(0, 5);
  const optPart = combo
    .map((v) => v.trim().toUpperCase().replace(/\s+/g, "").slice(0, 4))
    .filter(Boolean)
    .join("-");
  return optPart ? `${initials}-${optPart}` : `${initials}-001`;
}

/** Cartesian product — produces all combinations from option groups */
function cartesian(groups: OptionGroup[]): string[][] {
  const arrays = groups.filter((g) => g.name && g.values.length > 0).map((g) => g.values);
  if (arrays.length === 0) return [];
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((val) => [...combo, val])),
    [[]]
  );
}

/** Combo key for stable matching against existing DB variants */
function comboKey(combo: string[]) {
  return combo.map((v) => v.toLowerCase().trim()).join("|");
}

/** Reconstruct option groups from existing DB variants */
function extractOptionGroups(variants: ProductFull["variants"]): OptionGroup[] {
  const groupMap = new Map<string, Set<string>>();
  for (const v of variants) {
    if (v.options && typeof v.options === "object") {
      for (const [k, val] of Object.entries(v.options as Record<string, string>)) {
        if (!groupMap.has(k)) groupMap.set(k, new Set());
        groupMap.get(k)!.add(String(val));
      }
    }
  }
  if (groupMap.size === 0) return [{ name: "", values: [] }];
  return Array.from(groupMap.entries()).map(([name, valSet]) => ({
    name,
    values: Array.from(valSet),
  }));
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

/** Tag chip input */
function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInputVal("");
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 rounded-xl border border-white/[0.09] bg-[#111113] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((v) => (
        <span
          key={v}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-medium"
        >
          {v}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(values.filter((x) => x !== v)); }}
            className="text-indigo-400 hover:text-rose-400 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(inputVal); }
          else if (e.key === "Backspace" && !inputVal && values.length > 0) onChange(values.slice(0, -1));
        }}
        onBlur={() => { if (inputVal.trim()) commit(inputVal); }}
        placeholder={values.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
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

  // ─── Product-level state ─────────────────────────────────────────────────────
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
    !!product &&
    product.variants.some((v) => v.options && Object.keys(v.options as object).length > 0)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ─── Shared price/stock/sku state (applies to ALL variants) ──────────────────
  const base = product?.variants[0];
  const [shared, setShared] = useState<SharedState>({
    id: base?.id,
    sku: base?.sku ?? "",
    price: base ? String(base.price) : "",
    compareAtPrice: base?.compareAtPrice ? String(base.compareAtPrice) : "",
    inventoryQty: base ? String(base.inventoryQty) : "",
    weightGrams: base?.weightGrams ? String(base.weightGrams) : "",
    barcode: base?.barcode ?? "",
    skuLocked: !!base,
  });

  // ─── Option groups state ──────────────────────────────────────────────────────
  const hasExistingOptions =
    isEditing &&
    product.variants.some((v) => v.options && Object.keys(v.options as object).length > 0);

  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(
    hasExistingOptions ? extractOptionGroups(product!.variants) : [{ name: "", values: [] }]
  );

  // ─── Auto-generate SKU when title changes ────────────────────────────────────
  useEffect(() => {
    if (!title) return;
    setShared((prev) => (!prev.skuLocked ? { ...prev, sku: generateSku(title) } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
  }

  function updateOptionGroup(i: number, patch: Partial<OptionGroup>) {
    setOptionGroups((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }

  function addOptionGroup() {
    setOptionGroups((prev) => [...prev, { name: "", values: [] }]);
  }

  function removeOptionGroup(i: number) {
    setOptionGroups((prev) => prev.filter((_, idx) => idx !== i));
  }

  // ─── API error parser ─────────────────────────────────────────────────────────
  async function extractApiError(res: Response, fallback: string): Promise<string> {
    try {
      const data = await res.json();
      if (data.details && typeof data.details === "object") {
        const fieldMap: Record<string, string> = {
          price: "Price", inventoryQty: "Stock", sku: "SKU",
          title: "Product Name", slug: "URL Slug",
        };
        const msgs = Object.entries(data.details as Record<string, string[]>)
          .map(([field, errors]) => `${fieldMap[field] ?? field}: ${errors.join(", ")}`)
          .join(" · ");
        return msgs || data.error || fallback;
      }
      return data.error || fallback;
    } catch {
      return fallback;
    }
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave(saveStatus: "DRAFT" | "ACTIVE" | "ARCHIVED") {
    setError(null);
    setSavingAs(saveStatus);

    // Client-side validation
    if (!title.trim()) {
      setError("Product name is required.");
      setSavingAs(null);
      return;
    }
    if (!shared.price || parseFloat(shared.price) <= 0) {
      setError("Price is required — enter the amount customers will pay.");
      setSavingAs(null);
      return;
    }
    if (showVariants) {
      const hasOptions = optionGroups.some((g) => g.name && g.values.length > 0);
      if (!hasOptions) {
        setError("Add at least one option with values, e.g. Size → S, M, L.");
        setSavingAs(null);
        return;
      }
    }

    try {
      // ── 1. Save product ──
      const productBody = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        status: isEditing ? status : saveStatus === "ARCHIVED" ? "DRAFT" : saveStatus,
        brandId: brandId === "none" ? null : brandId,
        categoryIds: selectedCategoryIds,
      };

      let productId = product?.id;

      if (isEditing) {
        const res = await fetch(`/api/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...productBody, status }),
        });
        if (!res.ok) throw new Error(await extractApiError(res, "Update failed"));
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productBody),
        });
        if (!res.ok) throw new Error(await extractApiError(res, "Create failed"));
        const created = await res.json();
        productId = created.id;
      }

      const sharedPrice = parseFloat(shared.price) || 0;
      const sharedCompare = shared.compareAtPrice ? parseFloat(shared.compareAtPrice) : undefined;
      const sharedStock = shared.inventoryQty ? parseInt(shared.inventoryQty) : 0;

      if (!showVariants) {
        // ── 2a. Simple product — one variant, no options ──
        const payload = {
          sku: shared.sku.trim() || generateSku(title),
          price: sharedPrice,
          compareAtPrice: sharedCompare,
          inventoryQty: sharedStock,
          weightGrams: shared.weightGrams ? parseInt(shared.weightGrams) : undefined,
          barcode: shared.barcode.trim() || undefined,
          options: {},
        };
        if (shared.id) {
          const res = await fetch(`/api/products/${productId}/variants/${shared.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await extractApiError(res, "Failed to update variant"));
        } else {
          const res = await fetch(`/api/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await extractApiError(res, "Failed to create variant"));
        }
      } else {
        // ── 2b. Product with options — auto-create one variant per combination ──
        const combos = cartesian(optionGroups);
        const activeGroups = optionGroups.filter((g) => g.name && g.values.length > 0);

        // Map existing DB variants by combo key so we can PATCH instead of POST
        const existingByKey = new Map<string, string>(); // key → variant id
        if (product) {
          for (const v of product.variants) {
            if (v.options && typeof v.options === "object") {
              const key = comboKey(Object.values(v.options as Record<string, string>));
              existingByKey.set(key, v.id);
            }
          }
        }

        for (const combo of combos) {
          const optionsObj = Object.fromEntries(
            activeGroups.map((g, i) => [g.name, combo[i] ?? ""])
          );
          const key = comboKey(combo);
          const existingId = existingByKey.get(key);

          const payload = {
            sku: generateSku(title, combo),
            price: sharedPrice,
            compareAtPrice: sharedCompare,
            inventoryQty: sharedStock,
            options: optionsObj,
          };

          if (existingId) {
            const res = await fetch(`/api/products/${productId}/variants/${existingId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await extractApiError(res, `Failed to update variant ${combo.join("/")}`));
          } else {
            const res = await fetch(`/api/products/${productId}/variants`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await extractApiError(res, `Failed to create variant ${combo.join("/")}`));
          }
        }
      }

      // ── 3. Auto-inherit SEO ──
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

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* ── Sticky Header ─────────────────────────────────────────────────────── */}
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
          {error && <p className="text-xs text-rose-400 max-w-xs truncate">{error}</p>}
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

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">

          {/* ── Left: Images + Visibility ─────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Images */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Product Images</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">The first image becomes the cover photo</p>
              </div>
              {!isEditing ? (
                <div className="p-6">
                  <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-white/[0.1] bg-black/20 flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-zinc-500" />
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
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/40 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.media[0].url} alt={product.media[0].alt ?? product.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg">Cover Photo</span>
                        </div>
                      </div>
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
                  <div className="flex-1 py-2 rounded-lg text-xs font-medium text-center text-zinc-500">○ Hidden</div>
                  <div className="flex-1 py-2 rounded-lg text-xs font-medium text-center bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">● Published</div>
                </div>
              )}
              <p className="text-[11px] text-zinc-600 mt-3">
                {isEditing
                  ? status === "ACTIVE" ? "This product is live and visible to customers." : "This product is currently hidden."
                  : "Use the buttons above to choose Draft or Publish when saving."}
              </p>
            </div>
          </div>

          {/* ── Right: Product Details ─────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Details card */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-semibold text-white">Product Details</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Key info to describe and display your product</p>
                </div>
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
                    {/* Name */}
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

                    {/* Price (always visible — applies to all variants too) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel required hint="The amount customers pay">
                          {showVariants ? "Price (for all options)" : "Selling Price"}
                        </FieldLabel>
                        <PriceInput
                          value={shared.price}
                          onChange={(v) => setShared((s) => ({ ...s, price: v }))}
                          placeholder="0.00"
                          symbol={currencySymbol}
                        />
                      </div>
                      <div>
                        <FieldLabel hint="Leave blank if not on sale">Original Price (Was)</FieldLabel>
                        <PriceInput
                          value={shared.compareAtPrice}
                          onChange={(v) => setShared((s) => ({ ...s, compareAtPrice: v }))}
                          placeholder="Leave blank if no sale"
                          symbol={currencySymbol}
                        />
                      </div>
                    </div>

                    {/* Stock (always visible — optional) */}
                    <div>
                      <FieldLabel hint="How many units in stock. Leave blank if you track stock offline.">
                        {showVariants ? "Stock Count (for all options)" : "Stock Count (optional)"}
                      </FieldLabel>
                      <input
                        type="number"
                        min={0}
                        value={shared.inventoryQty}
                        onChange={(e) => setShared((s) => ({ ...s, inventoryQty: e.target.value }))}
                        placeholder="0 (optional)"
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

                    {/* SKU — only for simple products */}
                    {!showVariants && (
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/20 border border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-500">SKU:</span>
                          <span className="font-mono text-[11px] text-zinc-300">{shared.sku || "Auto-generated when you type the name"}</span>
                          {shared.skuLocked && <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">Custom</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShared((s) => ({ ...s, sku: generateSku(title), skuLocked: false }))}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition"
                        >
                          <RotateCcw className="h-3 w-3" /> Regenerate
                        </button>
                      </div>
                    )}

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
                  /* Advanced panel */
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
                          value={shared.weightGrams}
                          onChange={(e) => setShared((s) => ({ ...s, weightGrams: e.target.value }))}
                          placeholder="e.g. 500"
                          className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        />
                      </div>
                      <div>
                        <FieldLabel hint="Barcode, UPC, or GTIN if you have one">Barcode</FieldLabel>
                        <input
                          type="text"
                          value={shared.barcode}
                          onChange={(e) => setShared((s) => ({ ...s, barcode: e.target.value }))}
                          placeholder="Optional"
                          className="w-full h-12 px-4 rounded-xl border border-white/[0.09] bg-[#111113] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Option Group Builder ─────────────────────────────────────────── */}
            {showVariants && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#1a1a1d] overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-white">Product Options</h2>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Define what options your product comes in. All combinations will be created automatically using the price and stock above.
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {optionGroups.map((group, gi) => (
                    <div key={gi} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                      <div className="flex items-center gap-3">
                        {/* Option name */}
                        <div className="w-36 shrink-0">
                          <input
                            value={group.name}
                            onChange={(e) => updateOptionGroup(gi, { name: e.target.value })}
                            placeholder="e.g. Size"
                            list="option-name-suggestions"
                            className="w-full h-9 px-3 rounded-lg border border-white/[0.09] bg-[#111113] text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition"
                          />
                          <datalist id="option-name-suggestions">
                            <option value="Size" />
                            <option value="Color" />
                            <option value="Material" />
                            <option value="Style" />
                          </datalist>
                        </div>
                        {/* Tag values */}
                        <div className="flex-1">
                          <TagInput
                            values={group.values}
                            onChange={(vals) => updateOptionGroup(gi, { values: vals })}
                            placeholder={group.name === "Size" ? "S, M, L, XL — press Enter after each" : "Type a value, press Enter"}
                          />
                        </div>
                        {/* Remove */}
                        {optionGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeOptionGroup(gi)}
                            className="text-zinc-600 hover:text-rose-400 transition shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addOptionGroup}
                    className="flex items-center gap-1.5 text-[12px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add another option (e.g. Color)
                  </button>

                  {/* Combination preview */}
                  {cartesian(optionGroups).length > 0 && (
                    <div className="pt-3 border-t border-white/[0.05]">
                      <p className="text-[11px] text-zinc-500">
                        {cartesian(optionGroups).length} combination{cartesian(optionGroups).length !== 1 ? "s" : ""} will be created →{" "}
                        <span className="text-zinc-400">
                          {cartesian(optionGroups).slice(0, 4).map((c) => c.join("/")).join(", ")}
                          {cartesian(optionGroups).length > 4 ? ` + ${cartesian(optionGroups).length - 4} more` : ""}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
