import { CartProvider } from "@/components/storefront/cart-provider";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { MiniCartDrawer } from "@/components/storefront/mini-cart-drawer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-[#FDF1F3]">
        <Navbar />
        <MiniCartDrawer />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
