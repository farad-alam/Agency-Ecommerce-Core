import { getStorefrontProducts } from "@/storefront-sdk";
import { ProductCard } from "@/components/storefront/product-card";
import Link from "next/link";
import { db } from "@/lib/db"; // For sidebar filters

export default async function ProductsPage(props: {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    collection?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  
  // Resolve slugs to IDs if necessary, or pass slugs to SDK if SDK supports it.
  // Wait, the SDK currently expects categoryId, brandId.
  // Let's resolve the slugs to IDs here to keep the SDK clean, or modify SDK later.
  // For simplicity, let's look up the category/brand by slug.
  
  let categoryId = undefined;
  let brandId = undefined;
  let collectionId = undefined;

  if (searchParams.category) {
    const cat = await db.category.findUnique({ where: { slug: searchParams.category } });
    if (cat) categoryId = cat.id;
  }
  
  if (searchParams.brand) {
    const brand = await db.brand.findUnique({ where: { slug: searchParams.brand } });
    if (brand) brandId = brand.id;
  }

  if (searchParams.collection) {
    const col = await db.collection.findUnique({ where: { slug: searchParams.collection } });
    if (col) collectionId = col.id;
  }

  const page = searchParams.page ? parseInt(searchParams.page) : 1;

  const result = await getStorefrontProducts({
    categoryId,
    brandId,
    collectionId,
    search: searchParams.search,
    page,
    limit: 12,
  });

  // Fetch filter options for sidebar
  const [categories, brands] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.brand.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 flex-shrink-0">
          <div>
            <h3 className="font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products" 
                  className={`text-sm ${!searchParams.category ? "font-medium text-black" : "text-gray-600 hover:text-black"}`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.id}>
                  <Link 
                    href={`/products?category=${c.slug}`} 
                    className={`text-sm ${searchParams.category === c.slug ? "font-medium text-black" : "text-gray-600 hover:text-black"}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Brands</h3>
            <ul className="space-y-2">
              {brands.map(b => (
                <li key={b.id}>
                  <Link 
                    href={`/products?brand=${b.slug}`} 
                    className={`text-sm ${searchParams.brand === b.slug ? "font-medium text-black" : "text-gray-600 hover:text-black"}`}
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              {searchParams.search ? `Search results for "${searchParams.search}"` : 
               searchParams.category ? `Category: ${searchParams.category}` :
               searchParams.collection ? `Collection: ${searchParams.collection}` : "All Products"}
            </h1>
            <span className="text-sm text-gray-500">{result.metadata.total} products</span>
          </div>

          {result.data.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.data.map((product) => (
                  <ProductCard key={product.id} product={product as any} />
                ))}
              </div>

              {/* Pagination */}
              {result.metadata.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  {Array.from({ length: result.metadata.totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Retain existing search params while updating page
                    const urlParams = new URLSearchParams(searchParams as Record<string, string>);
                    urlParams.set("page", pageNum.toString());
                    
                    return (
                      <Link
                        key={pageNum}
                        href={`/products?${urlParams.toString()}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                          page === pageNum 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-gray-500 bg-gray-50 rounded-lg">
              No products found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
