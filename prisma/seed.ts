import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function seedStore() {
  await db.store.upsert({
    where: { id: "store_main" },
    update: {},
    create: {
      id: "store_main",
      name: "My Store",
      currency: "BDT",
      locale: "en",
      timezone: "Asia/Dhaka",
      taxMode: "NONE",
    },
  });
  console.log("✓ Store record");
}

async function seedAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@store.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      name: "Store Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`✓ Admin user: ${adminEmail}`);
}

async function seedDefaultShipping() {
  const zone = await db.shippingZone.upsert({
    where: { id: "zone_default" },
    update: {},
    create: {
      id: "zone_default",
      name: "Domestic",
      regions: ["BD"],
    },
  });

  await db.shippingRate.createMany({
    data: [
      {
        id: "rate_standard",
        zoneId: zone.id,
        name: "Standard Delivery",
        price: 60,
        minSubtotalForFree: 2000,
      },
      {
        id: "rate_express",
        zoneId: zone.id,
        name: "Express Delivery",
        price: 120,
        minSubtotalForFree: null,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Default shipping zone + rates");
}

async function seedDemoData() {
  // Brands
  const brandsData = [
    { name: "Artisan Co", slug: "artisan-co" },
    { name: "NovaTech", slug: "novatech" },
    { name: "EcoWear", slug: "ecowear" },
    { name: "LuxCraft", slug: "luxcraft" },
    { name: "PureForm", slug: "pureform" },
  ];

  for (const brand of brandsData) {
    await db.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log("✓ Brands (5)");

  // Parent categories
  const parentCats = [
    { name: "Clothing", slug: "clothing" },
    { name: "Electronics", slug: "electronics" },
    { name: "Home & Living", slug: "home-living" },
  ];

  for (const cat of parentCats) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Child categories
  const childCats = [
    { name: "T-Shirts", slug: "t-shirts", parentSlug: "clothing" },
    { name: "Outerwear", slug: "outerwear", parentSlug: "clothing" },
    { name: "Accessories", slug: "accessories", parentSlug: "clothing" },
    { name: "Smartphones", slug: "smartphones", parentSlug: "electronics" },
    { name: "Audio", slug: "audio", parentSlug: "electronics" },
    { name: "Wearables", slug: "wearables", parentSlug: "electronics" },
    { name: "Furniture", slug: "furniture", parentSlug: "home-living" },
    { name: "Kitchen", slug: "kitchen", parentSlug: "home-living" },
    { name: "Lighting", slug: "lighting", parentSlug: "home-living" },
  ];

  for (const child of childCats) {
    const parent = await db.category.findUnique({
      where: { slug: child.parentSlug },
    });
    await db.category.upsert({
      where: { slug: child.slug },
      update: {},
      create: { name: child.name, slug: child.slug, parentId: parent?.id },
    });
  }
  console.log("✓ Categories (3 parents, 9 children)");

  // Collections
  const collections = [
    { title: "New Arrivals", slug: "new-arrivals", description: "Fresh styles, just in.", sortOrder: 0 },
    { title: "Summer Picks", slug: "summer-picks", description: "Curated for the warm season.", sortOrder: 1 },
    { title: "Staff Picks", slug: "staff-picks", description: "Handpicked by our team.", sortOrder: 2 },
    { title: "Under ৳1,000", slug: "under-1000", description: "Great finds at unbeatable prices.", sortOrder: 3 },
  ];

  for (const col of collections) {
    await db.collection.upsert({
      where: { slug: col.slug },
      update: {},
      create: { ...col, status: "ACTIVE" },
    });
  }
  console.log("✓ Collections (4)");

  // Coupons
  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", type: "PERCENTAGE", value: 10, active: true },
      { code: "FLAT200", type: "FIXED", value: 200, minSubtotal: 1500, maxUses: 500, active: true },
      { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, active: true, expiresAt: new Date("2027-12-31") },
    ],
    skipDuplicates: true,
  });
  console.log("✓ Coupons (3)");

  // Demo customers
  const customers = [
    { email: "alice@example.com", name: "Alice Rahman", phone: "+8801711111111" },
    { email: "bob@example.com", name: "Bob Chowdhury", phone: "+8801722222222" },
    { email: "carol@example.com", name: "Carol Ahmed", phone: "+8801733333333" },
  ];

  for (const customer of customers) {
    await db.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        ...customer,
        passwordHash: await bcrypt.hash("Customer123!", 12),
        role: "CUSTOMER",
        emailVerified: true,
      },
    });
  }
  console.log("✓ Demo customers (3)");

  // Demo product: Classic Cotton Tee
  const ecowear = await db.brand.findUnique({ where: { slug: "ecowear" } });
  const tshirtsCategory = await db.category.findUnique({ where: { slug: "t-shirts" } });
  const newArrivalsCollection = await db.collection.findUnique({ where: { slug: "new-arrivals" } });
  const summerCollection = await db.collection.findUnique({ where: { slug: "summer-picks" } });
  const under1000Collection = await db.collection.findUnique({ where: { slug: "under-1000" } });

  const tee = await db.product.upsert({
    where: { slug: "classic-cotton-tee" },
    update: {},
    create: {
      title: "Classic Cotton Tee",
      slug: "classic-cotton-tee",
      description: "A wardrobe staple. 100% organic cotton, pre-shrunk, ethically made.",
      status: "ACTIVE",
      brandId: ecowear?.id,
    },
  });

  // Link category
  if (tshirtsCategory) {
    await db.categoryOnProduct.upsert({
      where: { productId_categoryId: { productId: tee.id, categoryId: tshirtsCategory.id } },
      update: {},
      create: { productId: tee.id, categoryId: tshirtsCategory.id },
    });
  }

  // Link collections
  for (const [idx, col] of [newArrivalsCollection, summerCollection, under1000Collection].entries()) {
    if (col) {
      await db.collectionOnProduct.upsert({
        where: { collectionId_productId: { collectionId: col.id, productId: tee.id } },
        update: {},
        create: { collectionId: col.id, productId: tee.id, position: idx },
      });
    }
  }

  // Variants
  const teeVariants = [
    { sku: "CCT-WHT-S", price: 650, compareAtPrice: 850, options: { Color: "White", Size: "S" }, inventoryQty: 20 },
    { sku: "CCT-WHT-M", price: 650, compareAtPrice: 850, options: { Color: "White", Size: "M" }, inventoryQty: 35 },
    { sku: "CCT-WHT-L", price: 650, compareAtPrice: 850, options: { Color: "White", Size: "L" }, inventoryQty: 15 },
    { sku: "CCT-BLK-S", price: 650, options: { Color: "Black", Size: "S" }, inventoryQty: 12 },
    { sku: "CCT-BLK-M", price: 650, options: { Color: "Black", Size: "M" }, inventoryQty: 3 }, // low stock
    { sku: "CCT-BLK-L", price: 650, options: { Color: "Black", Size: "L" }, inventoryQty: 0 }, // out of stock
  ];

  for (const v of teeVariants) {
    await db.productVariant.upsert({
      where: { sku: v.sku },
      update: {},
      create: { ...v, productId: tee.id },
    });
  }

  console.log("✓ Demo product: Classic Cotton Tee (6 variants)");
  console.log("ℹ️  Additional demo products can be seeded by expanding this file");
}

async function main() {
  console.log("🌱 Starting seed...");

  await seedStore();
  await seedAdminUser();
  await seedDefaultShipping();

  if (process.env.SEED_DEMO === "true") {
    console.log("\n🎭 Seeding demo data...");
    await seedDemoData();
  }

  console.log("\n✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
