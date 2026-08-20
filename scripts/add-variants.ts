import "dotenv/config";
import { db as prisma } from "../src/lib/db";

async function main() {
  console.log("Looking for Organic Cotton Classic Tee...");
  
  const product = await prisma.product.findUnique({
    where: { slug: "organic-cotton-tee" }
  });

  if (!product) {
    console.error("Product not found!");
    process.exit(1);
  }

  // Delete existing variants first so we don't have duplicates
  await prisma.productVariant.deleteMany({
    where: { productId: product.id }
  });

  console.log("Adding new variants...");

  const sizes = ["S", "M", "XL"];
  const colors = ["Red", "Yellow"];
  
  const basePrice = 35.00;
  const compareAtPrice = 45.00;
  let skuCounter = 1;

  for (const size of sizes) {
    for (const color of colors) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `APP-TEE-${size}-${color.toUpperCase()}-${skuCounter++}`,
          price: basePrice,
          compareAtPrice: compareAtPrice,
          inventoryQty: 50, // 50 items per variant
          options: {
            "Size": size,
            "Color": color
          }
        }
      });
      console.log(`Created variant: ${size} / ${color}`);
    }
  }

  console.log("Successfully added variants!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
