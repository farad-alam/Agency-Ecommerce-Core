import { getStorefrontCollections, getStorefrontProducts } from "@/storefront-sdk";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/storefront/product-card";
import { Hero, type HeroSlide } from "@/components/storefront/hero";

const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Agency Ecommerce Core",
    title: "The Core Collection",
    description:
      "Discover our curated selection of premium products, built to demonstrate the power of Agency Ecommerce Core.",
    imageUrl:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=1000&auto=format&fit=crop",
    ctaLabel: "Shop Now",
    ctaHref: "/products",
    secondaryCtaLabel: "All Categories",
    secondaryCtaHref: "/products?category=apparel",
  },
];

const heroCategories = [
  {
    label: "Electronics",
    href: "/products?category=electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?q=80&w=200&auto=format&fit=crop",
  },
  {
    label: "Apparel",
    href: "/products?category=apparel",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop",
  },
  {
    label: "Home & Living",
    href: "/products?category=home",
    imageUrl:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=200&auto=format&fit=crop",
  },
  {
    label: "New Arrivals",
    href: "/products?collection=new-arrivals",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop",
  },
];

export default async function StorefrontHomepage() {
  const [collections, newArrivals] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontProducts({ limit: 4, collectionId: "new-arrivals" })
  ]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <Hero slides={heroSlides} />

      {/* Category pills straddling the hero seam */}
      <section className="relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-20 lg:-mt-24">
            {heroCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-[#F56C73] to-[#D3113D] py-2.5 pl-2.5 pr-6 shadow-[0_10px_25px_rgba(211,17,61,0.25)] transition-transform hover:-translate-y-0.5"
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white">
                  <Image
                    src={cat.imageUrl}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <span className="font-heading text-lg font-medium text-white">
                  {cat.label}
                </span>
              </Link>
            ))}
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
