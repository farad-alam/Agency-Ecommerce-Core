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

  // 6. Create Products and Variants
  for (let i = 1; i <= 10; i++) {
    const isTech = i % 2 === 0;
    const cat = isTech ? categories[0] : categories[1];
    const brand = isTech ? brands[0] : brands[1];

    const product = await prisma.product.upsert({
      where: { slug: `demo-product-${i}` },
      update: {},
      create: {
        title: `Demo Product ${i}`,
        slug: `demo-product-${i}`,
        description: `This is a highly detailed description for Demo Product ${i}. It features amazing quality and great value.`,
        status: "ACTIVE",
        brandId: brand.id,
        seo: {
          create: {
            metaTitle: `Buy Demo Product ${i}`,
            metaDescription: `Shop Demo Product ${i} at the best price.`,
          }
        },
        categories: {
          create: {
            categoryId: cat.id
          }
        }
      }
    });

    // Add Variants
    const hasVariants = await prisma.productVariant.findFirst({ where: { productId: product.id } });
    if (!hasVariants) {
      await prisma.productVariant.createMany({
        data: [
          { productId: product.id, sku: `SKU-${i}-DEF`, price: 100 + (i * 10), compareAtPrice: 150 + (i * 10), inventoryQty: i === 3 ? 5 : 50, options: { variant: "Default" } },
          { productId: product.id, sku: `SKU-${i}-PRO`, price: 150 + (i * 10), inventoryQty: i === 5 ? 0 : 20, options: { variant: "Pro" } }
        ]
      });
    }

    // Assign to Collections
    await prisma.collectionOnProduct.upsert({
      where: { collectionId_productId: { collectionId: newArrivals.id, productId: product.id } },
      update: {},
      create: { collectionId: newArrivals.id, productId: product.id }
    });
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
          status: "FULFILLED",
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
