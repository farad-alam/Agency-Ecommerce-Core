"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Loader2, Plus, Trash2, X, Image as ImageIcon, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { Brand, Category } from "@prisma/client";
import type { ProductFull } from "@/app/(dashboard)/dashboard/products/[id]/page";
import { toast } from "sonner";
import Link from "next/link";
import { storeConfig } from "@/config/store.config";

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

// Auto-SKU Generator
function generateSku(title: string, options: VariantOption[]): string {
  if (!title) return "";
  
  // 1. Get initials from title (e.g., "Classic Cotton Tee" -> "CCT")
  const titleInitials = title
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase())
    .join("")
    .slice(0, 5); // Keep it reasonably short
    
  // 2. Get option values (e.g., "XL", "Blue" -> "XL-BLU")
  const optionValues = options
    .map(opt => opt.value.trim())
    .filter(val => val.length > 0)
    .map(val => val.toUpperCase().replace(/\s+/g, "").slice(0, 4)) // Abbreviate options
    .join("-");
    
  if (optionValues) {
    return `${titleInitials}-${optionValues}`;
  }
  
  return titleInitials ? `${titleInitials}-001` : "";
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
  skuLocked: boolean; // Track if user manually edited the SKU
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
  
  const [brandId, setBrandId] = useState(product?.brandId ?? "none");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.categoryId) ?? []
  );

  // Determine if it's a simple product (no variants/options)
  const [isSimpleProduct, setIsSimpleProduct] = useState(
    !product || (product.variants.length === 1 && Object.keys(product.variants[0].options as object || {}).length === 0)
  );

  const [showAdvancedSEO, setShowAdvancedSEO] = useState(false);
  const [showAdvancedVariantConfig, setShowAdvancedVariantConfig] = useState(false);

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
        skuLocked: true, // Existing variants are locked by default
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
        skuLocked: false,
      },
    ]
  );

  // SEO state
  const [metaTitle, setMetaTitle] = useState(product?.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.seo?.metaDescription ?? "");

  // Auto-generate SKUs when Title changes
  useEffect(() => {
    if (isSimpleProduct && title) {
      setVariants(prev => prev.map(v => {
        if (!v.skuLocked && !v.id) {
          return { ...v, sku: generateSku(title, []) };
        }
        return v;
      }));
    }
  }, [title, isSimpleProduct]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEditing) setSlug(slugify(val));
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
        sku: generateSku(title, [{ key: "", value: "" }]),
        price: prev[0]?.price || "",
        compareAtPrice: prev[0]?.compareAtPrice || "",
        inventoryQty: "0",
        weightGrams: "",
        barcode: "",
        options: [{ key: "", value: "" }],
        skuLocked: false,
      },
    ]);
  }

  function removeVariantRow(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVariantField(i: number, field: keyof VariantState, value: any) {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== i) return v;
        
        const updated = { ...v, [field]: value };
        
        // If user manually types SKU, lock it
        if (field === 'sku') {
           updated.skuLocked = true;
        }
        
        return updated;
      })
    );
  }
  
  function resetSku(i: number) {
    setVariants(prev => prev.map((v, idx) => {
      if (idx !== i) return v;
      return { 
        ...v, 
        sku: generateSku(title, isSimpleProduct ? [] : v.options), 
        skuLocked: false 
      };
    }));
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
    const newOptions = variant.options.filter((_, idx) => idx !== optionIndex);
    updateVariantField(variantIndex, "options", newOptions);
    
    // Auto-update SKU if not locked
    if (!variant.skuLocked && !variant.id) {
       updateVariantField(variantIndex, "sku", generateSku(title, newOptions));
    }
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
    
    // Auto-update SKU if not locked
    if (!variant.skuLocked && !variant.id) {
       updateVariantField(variantIndex, "sku", generateSku(title, newOptions));
    }
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const hasValidVariant = variants.some((v) => v.sku.trim() !== "");
    if (!hasValidVariant) {
      setError("Please ensure your product has an automatically generated or custom SKU.");
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

      if (isEditing) {
        const res = await fetch(`/api/products/${product!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to update product");
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create product");
        productId = (await res.json()).id;
      }

      for (const variant of variants) {
        if (!variant.sku.trim()) continue;

        // If simple product, don't save options
        let optionsObj = {};
        if (!isSimpleProduct) {
          optionsObj = variant.options.reduce((acc, curr) => {
            if (curr.key.trim() && curr.value.trim()) {
              acc[curr.key.trim()] = curr.value.trim();
            }
            return acc;
          }, {} as Record<string, string>);
        }

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

      if (metaTitle || metaDescription) {
        await fetch(`/api/products/${productId}/seo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metaTitle, metaDescription }),
        });
      }

      toast.success(isEditing ? "Product saved successfully!" : "Product created! You can now add images.");

      startTransition(() => {
        if (!isEditing) {
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
  const currencySymbol = storeConfig.currency === "BDT" ? "৳" : storeConfig.currency === "EUR" ? "€" : storeConfig.currency === "GBP" ? "£" : "$";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-5 lg:col-span-2">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="border border-white/[0.08] bg-[#18181b] mb-4">
            <TabsTrigger value="details" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">Basic Info</TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">Pricing & Inventory</TabsTrigger>
            <TabsTrigger value="seo" className="data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">Google SEO</TabsTrigger>
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
                <Label className="text-zinc-300">Product Name</Label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Classic Cotton Tee, Vanilla Scented Candle"
                  className="border-white/[0.12] bg-black/20 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Describe what makes this product special. What is it made of? Who is it for?"
                  rows={6}
                  className="border-white/[0.12] bg-black/20 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500"
                />
              </div>

              {/* Advanced SEO Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedSEO(!showAdvancedSEO)}
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {showAdvancedSEO ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showAdvancedSEO ? "Hide Advanced Settings" : "Show Advanced Settings (URL Slug)"}
                </button>
                
                {showAdvancedSEO && (
                  <div className="mt-4 p-4 rounded-lg bg-black/20 border border-white/[0.04] space-y-2">
                    <Label className="text-zinc-400">Website URL Slug (Auto-generated)</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="classic-cotton-tee"
                      className="border-white/[0.08] bg-black/40 font-mono text-sm text-zinc-400 focus-visible:ring-indigo-500"
                    />
                    <p className="text-xs text-zinc-500">Only change this if you specifically need a custom webpage link.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Media Upload Prompt / Display */}
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 shadow-sm">
              <Label className="mb-4 block text-zinc-300">Product Images</Label>
              {!isEditing ? (
                <div className="rounded-lg border border-dashed border-white/[0.12] bg-black/20 p-8 text-center text-sm text-zinc-500">
                  <ImageIcon className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
                  Create the product first to upload and manage images.
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
                      No images uploaded yet.
                    </div>
                  )}
                  <Link 
                    href={`/dashboard/products/${product.id}/media`} 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 h-9 px-4 py-2 w-full"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Manage Images
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Variants / Pricing tab */}
          <TabsContent value="variants" className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-4 mb-6 gap-4">
                <div>
                  <h3 className="text-base font-medium text-white">Pricing & Inventory</h3>
                  <p className="text-xs text-zinc-400 mt-1">Set prices and track stock levels.</p>
                </div>
                
                <div className="flex items-center gap-3 p-1 rounded-lg bg-black/40 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsSimpleProduct(true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isSimpleProduct ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Simple Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSimpleProduct(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!isSimpleProduct ? 'bg-indigo-500/20 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Product with Options
                  </button>
                </div>
              </div>

              {!isSimpleProduct && (
                <div className="flex justify-end mb-4">
                  <Button
                    type="button"
                    size="sm"
                    onClick={addVariantRow}
                    className="bg-zinc-800 text-white hover:bg-zinc-700 border border-white/[0.12]"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Another Variation
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                {(isSimpleProduct ? [variants[0]] : variants).map((v, i) => (
                  <div key={v.id || i} className={`relative rounded-lg border ${!isSimpleProduct ? 'border-white/[0.12] bg-black/20 p-5' : 'border-transparent'}`}>
                    
                    {!isSimpleProduct && !v.id && variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariantRow(i)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* Attributes/Options section - hidden for simple products */}
                    {!isSimpleProduct && (
                      <div className="space-y-3 pb-5 mb-5 border-b border-white/[0.08]">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-white">Product Attributes (e.g. Size, Color)</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => addOptionRow(i)}
                            className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Attribute
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {v.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <Input
                                value={opt.key}
                                onChange={(e) => updateOptionField(i, optIdx, "key", e.target.value)}
                                placeholder="Attribute (e.g. Size)"
                                className="h-9 border-white/[0.12] bg-white/[0.02] text-sm text-zinc-200"
                              />
                              <Input
                                value={opt.value}
                                onChange={(e) => updateOptionField(i, optIdx, "value", e.target.value)}
                                placeholder="Value (e.g. Medium)"
                                className="h-9 border-white/[0.12] bg-white/[0.02] text-sm text-zinc-200"
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
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Selling Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">{currencySymbol}</span>
                          <Input
                            value={v.price}
                            onChange={(e) => updateVariantField(i, "price", e.target.value)}
                            placeholder="0.00"
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-10 pl-7 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Original Price (Sale)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">{currencySymbol}</span>
                          <Input
                            value={v.compareAtPrice}
                            onChange={(e) => updateVariantField(i, "compareAtPrice", e.target.value)}
                            placeholder="Leave blank if no sale"
                            type="number"
                            min={0}
                            step="0.01"
                            className="h-10 pl-7 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Stock Quantity</Label>
                        <Input
                          value={v.inventoryQty}
                          onChange={(e) => updateVariantField(i, "inventoryQty", e.target.value)}
                          placeholder="Items available"
                          type="number"
                          min={0}
                          className="h-10 border-white/[0.12] bg-white/[0.04] text-white focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/[0.04]">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          Store SKU
                          {v.skuLocked && <span className="px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 text-[10px] tracking-normal lowercase">Custom</span>}
                        </Label>
                        <button 
                          type="button" 
                          onClick={() => resetSku(i)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center"
                          title="Regenerate SKU automatically"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Auto-generate
                        </button>
                      </div>
                      <div className="flex gap-3">
                        {v.mediaUrl && !isSimpleProduct && (
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded border border-white/[0.12] bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={v.mediaUrl} alt="Variant" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <Input
                          value={v.sku}
                          onChange={(e) => updateVariantField(i, "sku", e.target.value)}
                          placeholder="Automatically generated identifier"
                          className="h-9 border-white/[0.12] bg-black/40 font-mono text-xs text-zinc-300 focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Advanced Variant Config */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedVariantConfig(!showAdvancedVariantConfig)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showAdvancedVariantConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showAdvancedVariantConfig ? "Hide Shipping & Barcode" : "Add Shipping Weight & Barcode"}
                      </button>
                      
                      {showAdvancedVariantConfig && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-4 rounded-lg bg-black/20 border border-white/[0.04]">
                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Shipping Weight (grams)</Label>
                            <Input
                              value={v.weightGrams}
                              onChange={(e) => updateVariantField(i, "weightGrams", e.target.value)}
                              placeholder="e.g. 500"
                              type="number"
                              min={0}
                              className="h-8 border-white/[0.08] bg-white/[0.02] text-sm text-zinc-300"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Barcode (UPC/GTIN)</Label>
                            <Input
                              value={v.barcode}
                              onChange={(e) => updateVariantField(i, "barcode", e.target.value)}
                              placeholder="Optional scanner code"
                              className="h-8 border-white/[0.08] bg-white/[0.02] text-sm text-zinc-300"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SEO tab */}
          <TabsContent value="seo" className="space-y-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-6 space-y-5 shadow-sm">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex justify-between">
                  Google Search Title
                  <span className={`text-xs ${metaTitle.length > 70 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {metaTitle.length}/70
                  </span>
                </Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={100}
                  placeholder="What customers see in Google results"
                  className="border-white/[0.12] bg-black/20 text-white focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 flex justify-between">
                  Google Search Description
                  <span className={`text-xs ${metaDescription.length > 160 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {metaDescription.length}/160
                  </span>
                </Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={200}
                  placeholder="Short summary shown under the title in Google"
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
          <Label className="text-sm font-semibold text-white">Visibility</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="border-white/[0.12] bg-black/20 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/[0.12] bg-[#18181b] text-zinc-200">
              <SelectItem value="ACTIVE">Live (Visible on store)</SelectItem>
              <SelectItem value="DRAFT">Hidden (Draft)</SelectItem>
              <SelectItem value="ARCHIVED">Discontinued (Archived)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div className="rounded-xl border border-white/[0.08] bg-[#18181b] p-5 space-y-3 shadow-sm">
            <Label className="text-sm font-semibold text-white">Brand / Manufacturer</Label>
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
            <Label className="text-sm font-semibold text-white">Store Categories</Label>
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
            disabled={loading || !title.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm disabled:opacity-50 h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Save Product"
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
