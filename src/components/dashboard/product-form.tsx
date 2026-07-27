"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2, X, Image as ImageIcon } from "lucide-react";
import type { Brand, Category } from "@prisma/client";
import type { ProductFull } from "@/app/(dashboard)/dashboard/products/[id]/page";
import { toast } from "sonner";
import Link from "next/link";

interface Props {
  product?: ProductFull;
  brands: Brand[];
  categories: Category[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  mediaUrl?: string | null;
}

export function ProductForm({ product, brands, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!product;

  const [title, setTitle] = useState(product?.title ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">(
    (product?.status as "DRAFT" | "ACTIVE" | "ARCHIVED") ?? "DRAFT"
  );
  // Use "none" for empty state to fix Radix Select rendering issues
  const [brandId, setBrandId] = useState(product?.brandId ?? "none");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.categoryId) ?? []
  );

  // Initialize variants state
  const [variants, setVariants] = useState<VariantState[]>(
    product?.variants.map((v) => {
      const optsArray: VariantOption[] = [];
      if (v.options && typeof v.options === "object") {
        Object.entries(v.options as Record<string, string>).forEach(([k, val]) => {
          optsArray.push({ key: k, value: val });
        });
      }
      if (optsArray.length === 0) {
        optsArray.push({ key: "", value: "" }); // default empty row
      }

      // Variant media is not fetched in the current query
      const mediaUrl = undefined;

      return {
        id: v.id,
        sku: v.sku,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
        inventoryQty: String(v.inventoryQty),
        weightGrams: v.weightGrams ? String(v.weightGrams) : "",
        barcode: v.barcode || "",
        options: optsArray,
        mediaUrl,
      };
    }) ?? [
      {
        sku: "",
        price: "",
        compareAtPrice: "",
        inventoryQty: "0",
        weightGrams: "",
        barcode: "",
        options: [{ key: "", value: "" }],
      },
    ]
  );

  // SEO state
  const [metaTitle, setMetaTitle] = useState(product?.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.seo?.metaDescription ?? "");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
    // Auto-fill SEO if empty
    if (!metaTitle || metaTitle === product?.title) {
      setMetaTitle(val.slice(0, 70));
    }
  }

  function handleDescriptionChange(val: string) {
    setDescription(val);
    if (!metaDescription || metaDescription === product?.description?.slice(0, 160)) {
      setMetaDescription(val.replace(/(<([^>]+)>)/gi, "").slice(0, 160));
    }
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        price: "",
        compareAtPrice: "",
        inventoryQty: "0",
        weightGrams: "",
        barcode: "",
        options: [{ key: "", value: "" }],
      },
    ]);
  }

  function removeVariantRow(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVariantField(i: number, field: keyof VariantState, value: string | VariantOption[]) {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
    );
  }

  function addOptionRow(variantIndex: number) {
    const variant = variants[variantIndex];
    updateVariantField(variantIndex, "options", [
      ...variant.options,
      { key: "", value: "" },
    ]);
  }

  function removeOptionRow(variantIndex: number, optionIndex: number) {
    const variant = variants[variantIndex];
    updateVariantField(
      variantIndex,
      "options",
      variant.options.filter((_, idx) => idx !== optionIndex)
    );
  }

  function updateOptionField(
    variantIndex: number,
    optionIndex: number,
    field: "key" | "value",
    value: string
  ) {
    const variant = variants[variantIndex];
    const newOptions = variant.options.map((opt, idx) =>
      idx === optionIndex ? { ...opt, [field]: value } : opt
    );
    updateVariantField(variantIndex, "options", newOptions);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    // Validate Variants
    const hasValidVariant = variants.some((v) => v.sku.trim() !== "");
    if (!hasValidVariant) {
      setError("You must provide at least one variant with a valid SKU.");
      setSaving(false);
      return;
    }

    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        status,
        brandId: brandId === "none" ? null : brandId,
        categoryIds: selectedCategoryIds,
      };

      let productId = product?.id;

      // 1. Create or Update Product
      if (isEditing) {
        const res = await fetch(`/api/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to update product");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create product");
        }
        const newProduct = await res.json();
        productId = newProduct.id;
      }

      // 2. Save Variants (Create new or Update existing)
      for (const variant of variants) {
        if (!variant.sku.trim()) continue; // Skip empty rows

        const optionsObj = variant.options.reduce((acc, curr) => {
          if (curr.key.trim() && curr.value.trim()) {
            acc[curr.key.trim()] = curr.value.trim();
          }
          return acc;
        }, {} as Record<string, string>);

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
          // PATCH existing variant
          await fetch(`/api/products/${productId}/variants/${variant.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          // POST new variant
          await fetch(`/api/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      }

      // 3. Save SEO
      if (metaTitle || metaDescription) {
        await fetch(`/api/products/${productId}/seo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metaTitle, metaDescription }),
        });
      }

      toast.success(isEditing ? "Product updated successfully!" : "Product created successfully!");

      startTransition(() => {
        if (!isEditing) {
          // Redirect to edit page so they can upload images
          router.push(`/dashboard/products/${productId}`);
        }
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const loading = saving || isPending;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-5 lg:col-span-2">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="border border-white/[0.08] bg-[#18181b] mb-4">
            <TabsTrigger value="details" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">Details</TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">Variants</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">SEO</TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 space-y-5 shadow-sm">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-zinc-300">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Classic Cotton Tee"
                  className="border-white/[0.12] bg-black/20 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="classic-cotton-tee"
                  className="border-white/[0.12] bg-black/20 font-mono text-sm text-zinc-400 placeholder:text-zinc-700 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Product description…"
                  rows={6}
                  className="border-white/[0.12] bg-black/20 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            {/* Media Upload Prompt / Display */}
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 shadow-sm">
              <Label className="mb-4 block text-zinc-300">Media</Label>
              {!isEditing ? (
                <div className="rounded-lg border border-dashed border-white/[0.12] bg-black/20 p-8 text-center text-sm text-zinc-500">
                  <ImageIcon className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                  Save the product first to upload and manage media.
                </div>
              ) : (
                <div className="space-y-4">
                  {product?.media.length ? (
                    <div className="flex flex-wrap gap-4">
                      {product.media.map((m) => (
                        <div key={m.id} className="relative h-28 w-28 overflow-hidden rounded-lg border border-white/[0.12] bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/[0.12] bg-black/20 p-8 text-center text-sm text-zinc-500">
                      No media uploaded yet.
                    </div>
                  )}
                  {/* Provide a clear path to media management */}
                  <Link 
                    href={`/dashboard/products/${product.id}/media`} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 h-9 px-4 py-2 w-full"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Manage Media
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Variants tab */}
          <TabsContent value="variants" className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <h3 className="text-base font-medium text-white">Manage Variants</h3>
                <Button
                  type="button"
                  size="sm"
                  onClick={addVariantRow}
                  className="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/[0.12]"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-8">
                {variants.map((v, i) => (
                  <div key={v.id || i} className="relative rounded-lg border border-white/[0.12] bg-black/20 p-5">
                    {/* Delete variant button (only for new variants) */}
                    {!v.id && variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="space-y-2 lg:col-span-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">SKU</Label>
                        <div className="flex gap-3">
                          {v.mediaUrl && (
                            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded border border-white/[0.12] bg-zinc-900">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={v.mediaUrl} alt="Variant" className="h-full w-full object-cover" />
                            </div>
                          )}
                          <Input
                            value={v.sku}
                            onChange={(e) => updateVariantField(i, "sku", e.target.value)}
                            placeholder="SKU-001"
                            className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Price</Label>
                        <Input
                          value={v.price}
                          onChange={(e) => updateVariantField(i, "price", e.target.value)}
                          placeholder="0.00"
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Stock Qty</Label>
                        <Input
                          value={v.inventoryQty}
                          onChange={(e) => updateVariantField(i, "inventoryQty", e.target.value)}
                          placeholder="0"
                          type="number"
                          min={0}
                          className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Compare At Price</Label>
                        <Input
                          value={v.compareAtPrice}
                          onChange={(e) => updateVariantField(i, "compareAtPrice", e.target.value)}
                          placeholder="0.00"
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Weight (g)</Label>
                        <Input
                          value={v.weightGrams}
                          onChange={(e) => updateVariantField(i, "weightGrams", e.target.value)}
                          placeholder="0"
                          type="number"
                          min={0}
                          className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-2 lg:col-span-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Barcode (ISBN/UPC)</Label>
                        <Input
                          value={v.barcode}
                          onChange={(e) => updateVariantField(i, "barcode", e.target.value)}
                          placeholder="0123456789012"
                          className="h-9 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Options</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => addOptionRow(i)}
                          className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {v.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Input
                              value={opt.key}
                              onChange={(e) => updateOptionField(i, optIdx, "key", e.target.value)}
                              placeholder="e.g. Size"
                              className="h-8 border-white/[0.12] bg-white/[0.02] text-sm text-zinc-200"
                            />
                            <Input
                              value={opt.value}
                              onChange={(e) => updateOptionField(i, optIdx, "value", e.target.value)}
                              placeholder="e.g. XL"
                              className="h-8 border-white/[0.12] bg-white/[0.02] text-sm text-zinc-200"
                            />
                            {v.options.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOptionRow(i, optIdx)}
                                className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ID Indicator */}
                    {v.id && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Saved Variant</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <p className="text-xs text-zinc-500 text-center mt-6">
                  Modifying fields will update the variant upon clicking &quot;Save Changes&quot;.
                </p>
              )}
            </div>
          </TabsContent>

          {/* SEO tab */}
          <TabsContent value="seo" className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 space-y-5 shadow-sm">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex justify-between">
                  Meta Title
                  <span className={`text-xs ${metaTitle.length > 70 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {metaTitle.length}/70
                  </span>
                </Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={100}
                  placeholder="SEO page title"
                  className="border-white/[0.12] bg-black/20 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 flex justify-between">
                  Meta Description
                  <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {metaDescription.length}/160
                  </span>
                </Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={200}
                  placeholder="Brief description for search engines"
                  rows={4}
                  className="border-white/[0.12] bg-black/20 text-white focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status */}
        <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-5 space-y-3 shadow-sm">
          <Label className="text-sm font-semibold text-white">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="border-white/[0.12] bg-black/20 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.12] bg-[#18181b] text-zinc-200">
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-5 space-y-3 shadow-sm">
            <Label className="text-sm font-semibold text-white">Brand</Label>
            <Select value={brandId} onValueChange={(v) => setBrandId(v || "none")}>
              <SelectTrigger className="border-white/[0.12] bg-black/20 text-zinc-200">
                <SelectValue placeholder="Select brand…" />
              </SelectTrigger>
              <SelectContent className="border-white/[0.12] bg-[#18181b] text-zinc-200">
                <SelectItem value="none" className="text-zinc-500 italic">No brand</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-5 space-y-3 shadow-sm">
            <Label className="text-sm font-semibold text-white">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = selectedCategoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedCategoryIds((prev) =>
                        selected
                          ? prev.filter((id) => id !== cat.id)
                          : [...prev, cat.id]
                      )
                    }
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                        : "border-white/[0.12] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.2]"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={loading || !title.trim() || !slug.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Product"
            )}
          </Button>

          {isEditing && (
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Discard unsaved changes?")) {
                  router.push("/dashboard/products");
                }
              }}
              className="w-full mt-3 border-white/[0.12] bg-transparent text-zinc-300 hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
