import { CartProvider } from "@/components/storefront/cart-provider";
import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
import { MiniCartDrawer } from "@/components/storefront/mini-cart-drawer";
import { WhatsAppFab } from "@/components/storefront/whatsapp-fab";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrollProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col" style={{ background: "#0B0B0B" }}>
          <Navbar />
          <MiniCartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFab />
        </div>
      </CartProvider>
    </SmoothScrollProvider>
  );
}
