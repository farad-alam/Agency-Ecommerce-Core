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
import { Loader2, Plus, Trash2, X } from "lucide-react";
import type { Brand, Category } from "@prisma/client";
import type { ProductFull } from "@/app/(dashboard)/dashboard/products/[id]/page";

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
  const [brandId, setBrandId] = useState(product?.brandId ?? "");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.categoryId) ?? []
  );

  // Variants state
  const [variants, setVariants] = useState<
    { id?: string; sku: string; price: string; compareAtPrice: string; inventoryQty: string; options: string }[]
  >(
    product?.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: String(v.price),
      compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
      inventoryQty: String(v.inventoryQty),
      options: JSON.stringify(v.options),
    })) ?? [{ sku: "", price: "", compareAtPrice: "", inventoryQty: "0", options: "{}" }]
  );

  // SEO state
  const [metaTitle, setMetaTitle] = useState(product?.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.seo?.metaDescription ?? "");

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      { sku: "", price: "", compareAtPrice: "", inventoryQty: "0", options: "{}" },
    ]);
  }

  function removeVariantRow(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVariantField(
    i: number,
    field: keyof (typeof variants)[0],
    value: string
  ) {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        status,
        brandId: brandId || undefined,
        categoryIds: selectedCategoryIds,
      };

      let productId = product?.id;

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

      // Save variants (new ones only in create mode)
      for (const variant of variants) {
        if (!variant.id && variant.sku.trim()) {
          let parsedOptions: Record<string, string> = {};
          try {
            parsedOptions = JSON.parse(variant.options);
          } catch {
            parsedOptions = {};
          }

          await fetch(`/api/products/${productId}/variants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sku: variant.sku.trim(),
              price: parseFloat(variant.price),
              compareAtPrice: variant.compareAtPrice
                ? parseFloat(variant.compareAtPrice)
                : undefined,
              inventoryQty: parseInt(variant.inventoryQty) || 0,
              options: parsedOptions,
            }),
          });
        }
      }

      // SEO
      if (metaTitle || metaDescription) {
        await fetch(`/api/products/${productId}/seo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metaTitle, metaDescription }),
        });
      }

      startTransition(() => {
        router.push("/dashboard/products");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  }

  const loading = saving || isPending;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-5 lg:col-span-2">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="border border-white/[0.08] bg-[#18181b]">
            <TabsTrigger value="details" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Details</TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Variants</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">SEO</TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-6 space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-zinc-300">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Classic Cotton Tee"
                  className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300">Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="classic-cotton-tee"
                  className="border-white/[0.08] bg-white/[0.04] font-mono text-sm text-zinc-400 placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product description…"
                  rows={6}
                  className="border-white/[0.08] bg-white/[0.04] text-white placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Media placeholder */}
            {isEditing && product?.media.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-6">
                <Label className="mb-3 block text-zinc-300">Media</Label>
                <div className="flex flex-wrap gap-3">
                  {product.media.map((m) => (
                    <div key={m.id} className="h-24 w-24 overflow-hidden rounded-lg bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.alt ?? ""} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Variants tab */}
          <TabsContent value="variants" className="mt-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Variants</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addVariantRow}
                  className="border-white/[0.08] text-zinc-300 hover:bg-white/[0.04]"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs text-zinc-500">SKU</Label>
                      <Input
                        value={v.sku}
                        onChange={(e) => updateVariantField(i, "sku", e.target.value)}
                        placeholder="SKU-001"
                        className="h-8 border-white/[0.08] bg-white/[0.04] text-sm text-white"
                        disabled={!!v.id}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-zinc-500">Price</Label>
                      <Input
                        value={v.price}
                        onChange={(e) => updateVariantField(i, "price", e.target.value)}
                        placeholder="0"
                        type="number"
                        min={0}
                        className="h-8 border-white/[0.08] bg-white/[0.04] text-sm text-white"
                        disabled={!!v.id}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-zinc-500">Compare</Label>
                      <Input
                        value={v.compareAtPrice}
                        onChange={(e) => updateVariantField(i, "compareAtPrice", e.target.value)}
                        placeholder="0"
                        type="number"
                        min={0}
                        className="h-8 border-white/[0.08] bg-white/[0.04] text-sm text-white"
                        disabled={!!v.id}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-zinc-500">Qty</Label>
                      <Input
                        value={v.inventoryQty}
                        onChange={(e) => updateVariantField(i, "inventoryQty", e.target.value)}
                        placeholder="0"
                        type="number"
                        min={0}
                        className="h-8 border-white/[0.08] bg-white/[0.04] text-sm text-white"
                        disabled={!!v.id}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-zinc-500">Options (JSON)</Label>
                      <Input
                        value={v.options}
                        onChange={(e) => updateVariantField(i, "options", e.target.value)}
                        placeholder='{"Size":"M"}'
                        className="h-8 border-white/[0.08] bg-white/[0.04] font-mono text-xs text-zinc-400"
                        disabled={!!v.id}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {!v.id && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeVariantRow(i)}
                          className="h-8 w-8 text-zinc-600 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isEditing && (
                <p className="text-xs text-zinc-600">
                  Existing variants (greyed out) can be edited from the variant API.
                  New rows will be created on save.
                </p>
              )}
            </div>
          </TabsContent>

          {/* SEO tab */}
          <TabsContent value="seo" className="mt-4">
            <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300">
                  Meta Title{" "}
                  <span className="text-xs text-zinc-600">({metaTitle.length}/70)</span>
                </Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={70}
                  placeholder="SEO page title"
                  className="border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300">
                  Meta Description{" "}
                  <span className="text-xs text-zinc-600">({metaDescription.length}/160)</span>
                </Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  placeholder="Brief description for search engines"
                  rows={3}
                  className="border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Status */}
        <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-5 space-y-3">
          <Label className="text-sm font-semibold text-white">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="border-white/[0.08] bg-white/[0.04] text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#18181b] text-zinc-200">
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-5 space-y-3">
            <Label className="text-sm font-semibold text-white">Brand</Label>
            <Select value={brandId} onValueChange={(v) => setBrandId(v || "")}>
              <SelectTrigger className="border-white/[0.08] bg-white/[0.04] text-zinc-300">
                <SelectValue placeholder="Select brand…" />
              </SelectTrigger>
              <SelectContent className="border-white/[0.08] bg-[#18181b] text-zinc-200">
                <SelectItem value="">No brand</SelectItem>
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
          <div className="rounded-xl border border-white/[0.06] bg-[#18181b] p-5 space-y-3">
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? "border-indigo-500/50 bg-indigo-500/20 text-indigo-300"
                        : "border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-zinc-300"
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
        <Button
          onClick={handleSave}
          disabled={loading || !title.trim() || !slug.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
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
            onClick={() => router.push("/dashboard/products")}
            className="w-full border-white/[0.08] text-zinc-400 hover:bg-white/[0.04]"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
