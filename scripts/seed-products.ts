import "dotenv/config";
import { db as prisma } from "../src/lib/db";

const products = [
  {
    title: "Sony WH-1000XM5 Wireless Headphones",
    slug: "sony-wh-1000xm5",
    description: "Industry-leading noise cancellation. Two processors control 8 microphones for unprecedented noise cancellation. With Auto NC Optimizer, noise canceling is automatically optimized based on your wearing conditions and environment. Magnificent Sound, engineered to perfection with the new Integrated Processor V1.",
    status: "ACTIVE",
    price: 398.00,
    compareAtPrice: 449.00,
    inventoryQty: 45,
    sku: "SONY-WH-BLK",
    media: [
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1546435770-a3e426fa99f5?auto=format&fit=crop&q=80&w=1000"
    ]
  },
  {
    title: "Minimalist Ceramic Coffee Mug",
    slug: "minimalist-ceramic-mug",
    description: "Start your morning right with this beautifully crafted ceramic mug. Hand-thrown by artisans, each mug features a unique reactive glaze finish. Microwave and dishwasher safe, but hand washing is recommended to preserve the finish.",
    status: "ACTIVE",
    price: 24.00,
    compareAtPrice: null,
    inventoryQty: 120,
    sku: "HOME-MUG-WHT",
    media: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=1000"
    ]
  },
  {
    title: "Essential Everyday Backpack",
    slug: "essential-everyday-backpack",
    description: "The perfect companion for your daily commute or weekend getaway. Features a padded laptop sleeve that fits up to 15-inch devices, water-resistant exterior, and hidden passport pocket. Made from 100% recycled materials.",
    status: "ACTIVE",
    price: 89.00,
    compareAtPrice: null,
    inventoryQty: 85,
    sku: "BAG-ESS-NVY",
    media: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&q=80&w=1000"
    ]
  },
  {
    title: "Organic Cotton Classic Tee",
    slug: "organic-cotton-tee",
    description: "The ultimate basic. Crafted from 100% GOTS-certified organic cotton, this tee is incredibly soft, breathable, and sustainably made. Features a classic crew neckline and a relaxed fit.",
    status: "ACTIVE",
    price: 35.00,
    compareAtPrice: 45.00,
    inventoryQty: 250,
    sku: "APP-TEE-WHT",
    media: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000"
    ]
  }
];

async function main() {
  console.log("Starting seeding products...");
  
  for (const prod of products) {
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (existing) {
      console.log(`Product ${prod.slug} already exists, skipping...`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        status: prod.status as "ACTIVE",
        seo: {
          create: {
            metaTitle: prod.title.substring(0, 70),
            metaDescription: prod.description.substring(0, 160)
          }
        },
        variants: {
          create: [
            {
              sku: prod.sku,
              price: prod.price,
              compareAtPrice: prod.compareAtPrice,
              inventoryQty: prod.inventoryQty,
              options: {}
            }
          ]
        },
        media: {
          create: prod.media.map((url, i) => ({
            url: url,
            cloudinaryId: `seed_img_${prod.slug}_${i}`,
            position: i
          }))
        }
      }
    });
    console.log(`Created product: ${createdProduct.title}`);
  }
  
  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
