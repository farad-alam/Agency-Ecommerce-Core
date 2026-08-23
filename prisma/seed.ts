import { db as prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password";
  
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }

  // 2. Create Customers
  const customers = [
    { name: "John Doe", email: "john@example.com", phone: "+1234567890" },
    { name: "Jane Smith", email: "jane@example.com", phone: "+0987654321" }
  ];

  for (const c of customers) {
    const exists = await prisma.user.findUnique({ where: { email: c.email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          name: c.name,
          email: c.email,
          passwordHash: await bcrypt.hash("password", 12),
          role: "CUSTOMER",
          phone: c.phone,
        }
      });
    }
  }

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "electronics" }, update: {}, create: { name: "Electronics", slug: "electronics" } }),
    prisma.category.upsert({ where: { slug: "apparel" }, update: {}, create: { name: "Apparel", slug: "apparel" } }),
    prisma.category.upsert({ where: { slug: "home" }, update: {}, create: { name: "Home", slug: "home" } })
  ]);

  // 4. Create Brands
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: "techpro" }, update: {}, create: { name: "TechPro", slug: "techpro" } }),
    prisma.brand.upsert({ where: { slug: "styleco" }, update: {}, create: { name: "StyleCo", slug: "styleco" } }),
    prisma.brand.upsert({ where: { slug: "homelife" }, update: {}, create: { name: "HomeLife", slug: "homelife" } })
  ]);

  // 5. Create Collections
  const summerCollection = await prisma.collection.upsert({ where: { slug: "summer-sale" }, update: {}, create: { title: "Summer Sale", slug: "summer-sale", description: "Hot deals for summer" } });
  const newArrivals = await prisma.collection.upsert({ where: { slug: "new-arrivals" }, update: {}, create: { title: "New Arrivals", slug: "new-arrivals" } });

  // 6. Create Premium Streetwear Products
  const premiumProducts = [
    {
      title: "Oversized Heavyweight Tee - Onyx Black",
      slug: "oversized-heavyweight-tee-onyx",
      price: 1250,
      compareAtPrice: 1500,
      imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop" 
    },
    {
      title: "Parachute Cargo Pants - Desert Sand",
      slug: "parachute-cargo-pants-desert",
      price: 2100,
      compareAtPrice: 2499,
      imageUrl: "https://images.unsplash.com/photo-1628751586616-e41c471b05dc?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1617260551061-6d735071192e?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Boxy Fit Hoodie - Ash Grey",
      slug: "boxy-fit-hoodie-ash",
      price: 1850,
      compareAtPrice: 2200,
      imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Utility Vest - Tactical Black",
      slug: "utility-vest-tactical",
      price: 1450,
      compareAtPrice: null,
      imageUrl: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Vintage Wash Denim Jacket",
      slug: "vintage-wash-denim-jacket",
      price: 3200,
      compareAtPrice: 3800,
      imageUrl: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0efa?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Essential Drop-Shoulder Tee - Bone",
      slug: "essential-drop-shoulder-tee-bone",
      price: 950,
      compareAtPrice: 1200,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Relaxed Fit Corduroy Trousers",
      slug: "relaxed-fit-corduroy-trousers",
      price: 1950,
      compareAtPrice: 2150,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Minimalist Windbreaker - Midnight",
      slug: "minimalist-windbreaker-midnight",
      price: 2600,
      compareAtPrice: 2999,
      imageUrl: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop",
      hoverUrl: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop"
    }
  ];

  for (let i = 0; i < premiumProducts.length; i++) {
    const p = premiumProducts[i];
    
    // Create Product
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        title: p.title,
        slug: p.slug,
        description: "Premium streetwear essential crafted from heavyweight cotton for the perfect drape.",
        status: "ACTIVE",
        brandId: brands[1].id, // StyleCo
        categories: { create: { categoryId: categories[1].id } }, // Apparel
        seo: { create: { metaTitle: p.title, metaDescription: "Buy the latest streetwear drops." } }
      }
    });

    // Create Variants
    const hasVariants = await prisma.productVariant.findFirst({ where: { productId: product.id } });
    if (!hasVariants) {
      await prisma.productVariant.createMany({
        data: [
          { productId: product.id, sku: `SKU-${i}-M`, price: p.price, compareAtPrice: p.compareAtPrice, inventoryQty: 50, options: { size: "M" } },
          { productId: product.id, sku: `SKU-${i}-L`, price: p.price, compareAtPrice: p.compareAtPrice, inventoryQty: 30, options: { size: "L" } }
        ]
      });
    }

    // Assign to Collections
    await prisma.collectionOnProduct.upsert({
      where: { collectionId_productId: { collectionId: newArrivals.id, productId: product.id } },
      update: {},
      create: { collectionId: newArrivals.id, productId: product.id }
    });

    // Create Media (Thumbnail and Hover Image)
    const existingMedia = await prisma.media.findFirst({ where: { productId: product.id } });
    if (!existingMedia) {
      await prisma.media.createMany({
        data: [
          { productId: product.id, url: p.imageUrl, cloudinaryId: `img-${i}-1`, position: 1 },
          { productId: product.id, url: p.hoverUrl, cloudinaryId: `img-${i}-2`, position: 2 }
        ]
      });
    }
  }

  // 7. Create Demo Orders
  const testCustomer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  const variants = await prisma.productVariant.findMany({ take: 2, include: { product: true } });
  
  if (testCustomer && variants.length > 0) {
    const hasOrders = await prisma.order.findFirst();
    if (!hasOrders) {
      await prisma.order.create({
        data: {
          orderNumber: "ORD-20260726-9999",
          userId: testCustomer.id,
          status: "DELIVERED",
          paymentStatus: "PAID",
          total: 300,
          subtotal: 280,
          shippingTotal: 20,
          taxTotal: 0,
          discountTotal: 0,
          currency: "BDT",
          shippingAddress: { fullName: "John Doe", city: "Dhaka" },
          billingAddress: { fullName: "John Doe", city: "Dhaka" },
          items: {
            create: {
              variantId: variants[0].id,
              productTitle: variants[0].product.title,
              sku: variants[0].sku,
              price: variants[0].price,
              quantity: 2,
              variantOptions: variants[0].options || {},
            }
          }
        }
      });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
