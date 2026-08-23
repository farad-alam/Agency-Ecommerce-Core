import "dotenv/config";
import { db as prisma } from "../src/lib/db";

const premiumProducts = [
  {
    title: "Oversized Heavyweight Tee - Onyx Black",
    slug: "oversized-heavyweight-tee-onyx",
    price: 1250,
    compareAtPrice: 1500,
    inventoryQty: 50,
    sku: "OVSZ-TEE-BLK",
    media: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Parachute Cargo Pants - Desert Sand",
    slug: "parachute-cargo-pants-desert",
    price: 2100,
    compareAtPrice: 2499,
    inventoryQty: 30,
    sku: "CARGO-PANT-SND",
    media: [
      "https://images.unsplash.com/photo-1628751586616-e41c471b05dc?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1617260551061-6d735071192e?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Boxy Fit Hoodie - Ash Grey",
    slug: "boxy-fit-hoodie-ash",
    price: 1850,
    compareAtPrice: 2200,
    inventoryQty: 45,
    sku: "BOXY-HOOD-GRY",
    media: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Utility Vest - Tactical Black",
    slug: "utility-vest-tactical",
    price: 1450,
    compareAtPrice: null,
    inventoryQty: 15,
    sku: "UTIL-VEST-BLK",
    media: [
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Vintage Wash Denim Jacket",
    slug: "vintage-wash-denim-jacket",
    price: 3200,
    compareAtPrice: 3800,
    inventoryQty: 10,
    sku: "VINT-DENIM-JKT",
    media: [
      "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1495105787522-5334e3ffa0efa?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Essential Drop-Shoulder Tee - Bone",
    slug: "essential-drop-shoulder-tee-bone",
    price: 950,
    compareAtPrice: 1200,
    inventoryQty: 100,
    sku: "ESS-TEE-BONE",
    media: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Relaxed Fit Corduroy Trousers",
    slug: "relaxed-fit-corduroy-trousers",
    price: 1950,
    compareAtPrice: 2150,
    inventoryQty: 25,
    sku: "CORD-TROUSER-BRN",
    media: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    title: "Minimalist Windbreaker - Midnight",
    slug: "minimalist-windbreaker-midnight",
    price: 2600,
    compareAtPrice: 2999,
    inventoryQty: 20,
    sku: "WIND-BREAK-MID",
    media: [
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop"
    ]
  }
];

async function main() {
  console.log("Starting seeding streetwear products...");

  let newArrivals = await prisma.collection.findUnique({ where: { slug: "new-arrivals" } });
  if (!newArrivals) {
    newArrivals = await prisma.collection.create({ data: { title: "New Arrivals", slug: "new-arrivals", status: "ACTIVE" } });
  }

  for (const prod of premiumProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (existing) {
      console.log(`Product ${prod.slug} already exists, skipping...`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        title: prod.title,
        slug: prod.slug,
        description: "Premium streetwear essential crafted from heavyweight materials for the perfect drape.",
        status: "ACTIVE",
        seo: {
          create: {
            metaTitle: prod.title.substring(0, 70),
            metaDescription: "Premium streetwear drops."
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
            cloudinaryId: `seed_st_img_${prod.slug}_${i}`,
            position: i
          }))
        }
      }
    });

    // Add to collection
    await prisma.collectionOnProduct.create({
      data: {
        collectionId: newArrivals.id,
        productId: createdProduct.id
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
