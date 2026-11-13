/**
 * Product imagery.
 *
 * The `Product` record returned by the API has no image column, and the
 * backend is out of scope, so artwork is resolved on the client from the
 * product's stable SKU. Files live in this folder named `<SKU>.jpg` and are
 * imported through Vite so they get content-hashed and bundled - no runtime
 * dependency on a third-party CDN, and nothing to break if a remote host
 * changes a URL.
 *
 * Resolution order:
 *   1. exact SKU            (ELEC-001 -> ELEC-001.jpg)
 *   2. SKU prefix/category  (a new ELEC-0xx still gets an electronics photo)
 *   3. null                 (caller renders its icon placeholder)
 */

const modules = import.meta.glob('./*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>;

/** `{ 'ELEC-001': '/assets/ELEC-001.<hash>.jpg', ... }` */
const BY_SKU: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([filePath, url]) => [
    filePath.replace(/^\.\//, '').replace(/\.jpg$/i, '').toUpperCase(),
    url,
  ])
);

/** One representative image per catalogue category, used when the SKU is unknown. */
const BY_CATEGORY: Record<string, string | undefined> = {
  ELECTRONICS: BY_SKU['ELEC-001'],
  CLOTHING: BY_SKU['CLTH-001'],
  BOOKS: BY_SKU['BOOK-002'],
  GIFT_CARD: BY_SKU['GIFT-001'],
  PERISHABLE: BY_SKU['PERI-001'],
  PERSONALIZED: BY_SKU['PERS-001'],
  HOME: BY_SKU['HOME-001'],
  SPORTS: BY_SKU['SPRT-001'],
  OTHER: BY_SKU['OTHR-001'],
};

/** SKU prefixes map onto the same categories, for SKUs not individually shot. */
const BY_PREFIX: Record<string, string | undefined> = {
  ELEC: BY_CATEGORY.ELECTRONICS,
  CLTH: BY_CATEGORY.CLOTHING,
  BOOK: BY_CATEGORY.BOOKS,
  GIFT: BY_CATEGORY.GIFT_CARD,
  PERI: BY_CATEGORY.PERISHABLE,
  PERS: BY_CATEGORY.PERSONALIZED,
  HOME: BY_CATEGORY.HOME,
  SPRT: BY_CATEGORY.SPORTS,
  OTHR: BY_CATEGORY.OTHER,
};

export interface ImageableProduct {
  sku?: string | null;
  category?: string | null;
}

/** Returns a bundled image URL for a product, or null when nothing fits. */
export function getProductImage(product?: ImageableProduct | null): string | null {
  if (!product) return null;

  const sku = product.sku?.trim().toUpperCase();
  if (sku && BY_SKU[sku]) return BY_SKU[sku];

  const category = product.category?.trim().toUpperCase();
  if (category && BY_CATEGORY[category]) return BY_CATEGORY[category]!;

  if (sku) {
    const prefix = sku.split('-')[0];
    if (BY_PREFIX[prefix]) return BY_PREFIX[prefix]!;
  }

  return null;
}

/** Exposed for tests/tooling that want to assert catalogue coverage. */
export const productImageSkus = Object.keys(BY_SKU).sort();
