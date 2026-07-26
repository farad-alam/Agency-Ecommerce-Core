# Agency Ecommerce Core — Collections Schema

**Version:** v1.0
**Status:** Missing from Architecture doc — V1 scope item requiring Prisma model addition

---

## 0. Problem

The Vision doc lists **Collections** in V1 scope. The Architecture doc's Prisma schema has no `Collection` model. This document defines the schema, differentiates Collections from Categories, and specifies the full API and dashboard page.

---

## 1. Collections vs. Categories — The Difference

| | Category | Collection |
|---|---|---|
| **Purpose** | Taxonomic classification — what *type* of product this is | Curated editorial grouping — any set of products, for any reason |
| **Structure** | Hierarchical tree (parentId) | Flat list of manually chosen products |
| **Assignment** | Products belong to categories automatically by type | Products are manually added to collections by a merchant |
| **Examples** | "Electronics > Phones > Smartphones" | "New Arrivals", "Summer Sale", "Staff Picks", "Under ৳1000" |
| **Storefront use** | Navigation menu, faceted filtering | Landing pages, promotional banners, homepage sections |

A product can be in **multiple categories** and **multiple collections**. These are independent systems.

---

## 2. Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model Collection {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  description String?
  status      CollectionStatus @default(DRAFT)    // DRAFT | ACTIVE | ARCHIVED
  mediaId     String?
  media       Media?    @relation("CollectionMedia", fields: [mediaId], references: [id])
  products    CollectionOnProduct[]
  seo         CollectionSeoMeta?
  sortOrder   Int       @default(0)              // controls display order on storefront
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model CollectionOnProduct {
  collectionId String
  productId    String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  position     Int        @default(0)            // product ordering within the collection

  @@id([collectionId, productId])
  @@index([collectionId, position])
}

model CollectionSeoMeta {
  id             String     @id @default(cuid())
  collectionId   String     @unique
  collection     Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  metaTitle      String?
  metaDescription String?
}

enum CollectionStatus { DRAFT ACTIVE ARCHIVED }
```

### Schema additions to existing models

```prisma
// Add to Product model:
collections  CollectionOnProduct[]

// Add to Media model (for collection hero image):
collectionMedia  Collection[] @relation("CollectionMedia")
```

---

## 3. Design Decisions

- **Status field.** Collections can be in DRAFT before being published. This lets merchants build "Black Friday" collections in advance.
- **`sortOrder` on Collection.** Controls the display order when listing all collections on the storefront (e.g. homepage collection rows). Editable from the dashboard.
- **`position` on CollectionOnProduct.** Controls the order of products within a collection. Allows a merchant to pin specific products to the top.
- **One hero image per Collection.** Uses the existing `Media` model via a nullable `mediaId` reference. No separate media table needed.
- **SEO meta as a separate model.** Consistent with how `SeoMeta` works for products — nullable one-to-one relationship.
- **Cascade delete on relationships.** Deleting a Collection removes its `CollectionOnProduct` rows and `CollectionSeoMeta`. Deleting a Product removes it from all collections (but does not delete the collections).

---

## 4. API Endpoints

### Public (Storefront)

| Route | Method | Notes |
|---|---|---|
| `/api/collections` | GET | Lists ACTIVE collections. Supports `?limit=` and `?cursor=` |
| `/api/collections/[slug]` | GET | Returns collection + first page of products |
| `/api/collections/[slug]/products` | GET | Paginated products in collection. Supports `?sort=&limit=&cursor=` |

### Dashboard (STAFF/ADMIN)

| Route | Method | Notes |
|---|---|---|
| `/api/collections` | POST | Create collection |
| `/api/collections/[id]` | PATCH | Update title, slug, description, status, seo |
| `/api/collections/[id]` | DELETE | Archive or hard-delete collection |
| `/api/collections/[id]/products` | POST | Add products to collection (array of productIds) |
| `/api/collections/[id]/products/[productId]` | DELETE | Remove a product from collection |
| `/api/collections/[id]/products/reorder` | PATCH | Update product positions within collection |
| `/api/collections/reorder` | PATCH | Update collection sortOrder |

---

## 5. Core Logic

```ts
// src/core/collections/index.ts

import { db } from "@/lib/db";
import { Errors } from "@/core/errors";

export async function getCollections(status = "ACTIVE") {
  return db.collection.findMany({
    where: { status },
    orderBy: { sortOrder: "asc" },
    include: {
      media: true,
      _count: { select: { products: true } },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  const collection = await db.collection.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      media: true,
      seo: true,
      products: {
        orderBy: { position: "asc" },
        take: 20,
        include: {
          product: {
            include: {
              variants: { orderBy: { price: "asc" }, take: 1 },
              media: { orderBy: { position: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!collection) throw Errors.notFound("Collection");
  return collection;
}

export async function addProductsToCollection(collectionId: string, productIds: string[]) {
  // Validate all products exist and are ACTIVE
  const products = await db.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    select: { id: true },
  });

  if (products.length !== productIds.length) {
    throw Errors.notFound("One or more products");
  }

  // Get current max position in collection
  const maxPos = await db.collectionOnProduct.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  let nextPosition = (maxPos._max.position ?? -1) + 1;

  // Insert new products (skip duplicates)
  await db.collectionOnProduct.createMany({
    data: productIds.map((productId) => ({
      collectionId,
      productId,
      position: nextPosition++,
    })),
    skipDuplicates: true,
  });
}

export async function reorderCollectionProducts(
  collectionId: string,
  orderedProductIds: string[]
) {
  // Update position for each product in the new order
  await db.$transaction(
    orderedProductIds.map((productId, index) =>
      db.collectionOnProduct.update({
        where: { collectionId_productId: { collectionId, productId } },
        data: { position: index },
      })
    )
  );
}
```

---

## 6. Dashboard Page

```
/dashboard/collections           → list all collections (DRAFT, ACTIVE, ARCHIVED)
/dashboard/collections/new       → create collection
/dashboard/collections/[id]      → edit collection
  - Tabs: General | Products | SEO
  - General: title, slug, description, status, hero image, sortOrder
  - Products: search products → add button, drag-to-reorder list, remove button
  - SEO: metaTitle, metaDescription with character count hints
```

---

## 7. Storefront Usage (Informational — Client-Owned)

```tsx
// Example: Server Component — homepage featured collections
import { serverProducts } from "@/storefront-sdk";

export default async function HomePage() {
  const collections = await serverProducts.getCollections();

  return (
    <section>
      {collections.data.map((collection) => (
        <a key={collection.id} href={`/collections/${collection.slug}`}>
          <img src={collection.media?.url} alt={collection.title} />
          <h2>{collection.title}</h2>
        </a>
      ))}
    </section>
  );
}
```

---

## 8. File Map

```
prisma/
└── schema.prisma                          # Add Collection, CollectionOnProduct, CollectionSeoMeta

src/
├── core/
│   └── collections/
│       ├── index.ts                       # Business logic: get, create, update, addProducts, reorder
│       └── types.ts                       # CollectionWithProducts type
├── app/
│   ├── api/
│   │   └── collections/
│   │       ├── route.ts                   # GET (public list), POST (dashboard create)
│   │       └── [id]/
│   │           ├── route.ts               # GET (public detail by slug), PATCH, DELETE
│   │           ├── products/
│   │           │   ├── route.ts           # POST (add products), paginated GET
│   │           │   └── [productId]/route.ts # DELETE (remove product)
│   │           ├── products/reorder/route.ts # PATCH positions
│   │           └── reorder/route.ts       # PATCH sortOrder (multiple collections)
│   └── (dashboard)/
│       └── dashboard/
│           └── collections/
│               ├── page.tsx               # Collections list
│               ├── new/page.tsx           # Create form
│               └── [id]/page.tsx          # Edit form with tabs
```
