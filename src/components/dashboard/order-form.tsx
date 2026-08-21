"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search } from "lucide-react";

type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: string;
  title: string; // Combined product + variant title
  inventoryQty: number;
};

export function OrderForm({ mode = "create", initialData }: { mode?: "create" | "edit", initialData?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Form State
  const [guestEmail, setGuestEmail] = useState(initialData?.guestEmail || "");
  const [items, setItems] = useState<Array<{ variantId: string, quantity: number, price: number, title: string }>>(
    initialData?.items?.map((i: any) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      price: Number(i.price),
      title: i.productTitle
    })) || []
  );
  
  const [shippingAddress, setShippingAddress] = useState(initialData?.shippingAddress || {
    fullName: "",
    line1: "",
    city: "",
    region: "",
    postalCode: "",
    country: "Bangladesh",
    phone: ""
  });

  const [shippingTotal, setShippingTotal] = useState(initialData ? Number(initialData.shippingTotal) : 150);
  const [discountTotal, setDiscountTotal] = useState(initialData ? Number(initialData.discountTotal) : 0);
  
  const [paymentProvider, setPaymentProvider] = useState(initialData?.paymentProvider || "cod");
  const [paymentStatus, setPaymentStatus] = useState(initialData?.paymentStatus || "UNPAID");

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + shippingTotal - discountTotal;

  useEffect(() => {
    if (!searchTerm) {
      setVariants([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/storefront/products/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (data.data) {
          // Flatten products into variants for easier selection
          const flatVariants: ProductVariant[] = [];
          data.data.forEach((p: any) => {
            p.variants.forEach((v: any) => {
              flatVariants.push({
                id: v.id,
                productId: p.id,
                sku: v.sku,
                price: v.price,
                title: `${p.title} - ${Object.values(v.options || {}).join(" / ")}`,
                inventoryQty: v.inventoryQty
              });
            });
          });
          setVariants(flatVariants);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const addVariant = (v: ProductVariant) => {
    if (items.some(i => i.variantId === v.id)) {
      toast.error("Item already in order");
      return;
    }
    setItems([...items, { variantId: v.id, quantity: 1, price: Number(v.price), title: v.title }]);
    setSearchTerm("");
    setVariants([]);
  };

  const removeItem = (variantId: string) => {
    setItems(items.filter(i => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, qty: number) => {
    if (qty < 1) return;
    setItems(items.map(i => i.variantId === variantId ? { ...i, quantity: qty } : i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }
    if (!guestEmail) {
      toast.error("Customer email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        guestEmail,
        items,
        shippingAddress,
        shippingTotal,
        discountTotal,
        paymentProvider,
        paymentStatus,
      };

      const url = mode === "create" ? "/api/dashboard/orders" : `/api/dashboard/orders/${initialData.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save order");
      }
      
      toast.success(mode === "create" ? "Order created successfully" : "Order updated successfully");
      router.push("/dashboard/orders");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Order Items</h2>
            
            <div className="mb-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search products by title..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                {isSearching && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />}
              </div>
              
              {variants.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {variants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => addVariant(v)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-700 border-b border-zinc-700/50 last:border-0 flex justify-between items-center"
                    >
                      <div className="truncate pr-4">
                        <p className="text-sm font-medium text-white truncate">{v.title}</p>
                        <p className="text-xs text-zinc-400">SKU: {v.sku} · Stock: {v.inventoryQty}</p>
                      </div>
                      <span className="text-sm font-semibold text-white whitespace-nowrap">{v.price} BDT</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/[0.1] rounded-lg text-zinc-500 text-sm">
                  No items added yet. Search above to add items.
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.variantId} className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-lg border border-white/[0.05]">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-zinc-400">{item.price} BDT</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.variantId, parseInt(e.target.value) || 1)}
                        className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-center text-white focus:outline-none"
                      />
                      <span className="text-sm font-medium text-white w-20 text-right">
                        {(item.price * item.quantity).toLocaleString()} BDT
                      </span>
                      <button type="button" onClick={() => removeItem(item.variantId)} className="text-zinc-500 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Payment & Totals</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Payment Provider</label>
                <select value={paymentProvider} onChange={e => setPaymentProvider(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="cod">Cash on Delivery (COD)</option>
                  <option value="mfs">Mobile Banking (MFS)</option>
                  <option value="manual">Manual Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Payment Status</label>
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-white/[0.08] pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-white font-medium">{subtotal.toLocaleString()} BDT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Shipping</span>
                <input type="number" min="0" value={shippingTotal} onChange={e => setShippingTotal(Number(e.target.value))} className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-right text-white" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Discount</span>
                <input type="number" min="0" value={discountTotal} onChange={e => setDiscountTotal(Number(e.target.value))} className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-right text-white" />
              </div>
              <div className="flex justify-between items-center border-t border-white/[0.08] pt-3 mt-3">
                <span className="text-base font-medium text-white">Total</span>
                <span className="text-lg font-bold text-white">{total.toLocaleString()} BDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Customer Info</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
              <input required type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="customer@example.com" />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Full Name</label>
                <input required type="text" value={shippingAddress.fullName} onChange={e => setShippingAddress({...shippingAddress, fullName: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Phone</label>
                <input required type="tel" value={shippingAddress.phone} onChange={e => setShippingAddress({...shippingAddress, phone: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Address Line 1</label>
                <input required type="text" value={shippingAddress.line1} onChange={e => setShippingAddress({...shippingAddress, line1: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">City</label>
                  <input required type="text" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Postal Code</label>
                  <input type="text" value={shippingAddress.postalCode} onChange={e => setShippingAddress({...shippingAddress, postalCode: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.08]">
        <button type="button" onClick={() => router.back()} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {mode === "create" ? "Create Order" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
