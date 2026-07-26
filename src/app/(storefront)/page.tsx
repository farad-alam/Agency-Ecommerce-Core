import { getStorefrontCollections, getStorefrontProducts } from "@/storefront-sdk";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/storefront/product-card";

export default async function StorefrontHomepage() {
  const [collections, newArrivals] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontProducts({ limit: 4, collectionId: "new-arrivals" })
  ]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[70vh] bg-gray-900 text-white flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
          alt="Hero background"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="relative z-10 text-center space-y-6 px-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">The Core Collection</h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
            Discover our curated selection of premium products, built to demonstrate the power of Agency Ecommerce Core.
          </p>
          <div className="pt-4">
            <Link 
              href="/products" 
              className="bg-white text-black px-8 py-4 rounded-md font-medium hover:bg-gray-100 transition-colors inline-block"
            >
              Shop All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="container mx-auto px-4 space-y-8">
        <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.slice(0, 3).map((collection: any) => (
            <Link 
              key={collection.id} 
              href={`/products?collection=${collection.slug}`}
              className="group relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            >
              {collection.media ? (
                <Image
                  src={collection.media.url}
                  alt={collection.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-200 to-gray-50" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="relative z-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-md">
                <h3 className="text-lg font-semibold text-gray-900">{collection.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">New Arrivals</h2>
          <Link href="/products?collection=new-arrivals" className="text-sm font-medium text-gray-600 hover:text-black underline underline-offset-4">
            View All
          </Link>
        </div>
        
        {newArrivals.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.data.map((product: any) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
            No products found in the "new-arrivals" collection.
          </div>
        )}
      </section>
    </div>
  );
}
