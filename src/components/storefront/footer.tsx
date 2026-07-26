import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/products" className="hover:text-black">All Products</Link></li>
              <li><Link href="/products?collection=new-arrivals" className="hover:text-black">New Arrivals</Link></li>
              <li><Link href="/products?collection=summer-sale" className="hover:text-black">Summer Sale</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/faq" className="hover:text-black">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-black">Shipping & Returns</Link></li>
              <li><Link href="/contact" className="hover:text-black">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/about" className="hover:text-black">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-black">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-black">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-gray-600 mb-4">Subscribe for updates and exclusive offers.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Email address" className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" />
              <button type="submit" className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Reference Storefront. Built with Agency Ecommerce Core.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            {/* Social icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
