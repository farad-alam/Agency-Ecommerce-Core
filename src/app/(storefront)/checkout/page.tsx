"use client";

import { useCart } from "@/components/storefront/cart-provider";
import { getAvailableShippingRates, submitCheckout } from "@/storefront-sdk/checkout";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function CheckoutPage() {
  const { cart, isLoading, refreshCart, subtotal, total } = useCart();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
    phone: "",
  });

  const [rates, setRates] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cart && cart.items.length > 0) {
      // Fetch shipping rates for default country
      getAvailableShippingRates(formData.country, subtotal).then(r => {
        setRates(r);
        if (r.length > 0 && !selectedRateId) setSelectedRateId(r[0].id);
      });
    } else if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push("/cart");
    }
  }, [cart, isLoading, formData.country, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRateId) {
      toast.error("Please select a shipping method");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const address = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        line1: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country,
        phone: formData.phone,
      };

      const order = await submitCheckout({
        guestEmail: formData.email,
        shippingAddress: address,
        billingAddress: address, // Same for simplicity
      });

      await refreshCart();
      router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to process checkout");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const selectedRate = rates.find(r => r.id === selectedRateId);
  const shippingCost = selectedRate ? Number(selectedRate.price) : 0;
  const finalTotal = total + shippingCost;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col-reverse lg:flex-row gap-12 max-w-6xl mx-auto">
        
        {/* Checkout Form */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md" />
                </div>
              </div>
            </section>

            {/* Shipping Method */}
            <section>
              <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
              {rates.length > 0 ? (
                <div className="space-y-3">
                  {rates.map(rate => (
                    <label key={rate.id} className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${selectedRateId === rate.id ? "border-black bg-gray-50" : "hover:border-gray-400"}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shippingRate" value={rate.id} checked={selectedRateId === rate.id} onChange={(e) => setSelectedRateId(e.target.value)} className="w-4 h-4 text-black focus:ring-black" />
                        <div>
                          <p className="font-medium">{rate.name}</p>
                          <p className="text-sm text-gray-500">
                            {Number(rate.minDays)} - {Number(rate.maxDays)} business days
                          </p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {rate.price === 0 ? "Free" : `BDT ${rate.price.toLocaleString()}`}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No shipping rates available for this destination.</p>
              )}
            </section>

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedRateId}
              className="w-full bg-black text-white py-4 rounded-md font-medium text-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex justify-center items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
            <p className="text-xs text-gray-500 text-center mt-4">
              Note: Payment is deferred in this demo. Order will be marked as Pending.
            </p>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-[450px]">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24 border">
            <h2 className="text-lg font-bold mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 aspect-square bg-gray-200 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center text-xs">
                    Img
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-[10px] z-10">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium line-clamp-2">{item.productTitle}</p>
                    <p className="text-gray-500 mt-1 capitalize">
                       {Object.values(item.variantOptions as Record<string, string> || {}).join(" / ")}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    BDT {(Number(item.price) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>BDT {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{selectedRate ? (shippingCost === 0 ? "Free" : `BDT ${shippingCost.toLocaleString()}`) : "—"}</span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-xl pt-6 mt-6 border-t border-gray-200">
              <span>Total</span>
              <span>BDT {finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
