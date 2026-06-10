/**

 * Supabase catalog read layer (storefront when CATALOG_READ_SOURCE=supabase).

 */

import 'server-only';

import type { Bouquet, Partner } from '@/lib/bouquets';

import { bouquetIsAvailableForDestination } from '@/lib/bouquetDestinationAvailability';

import { PRODUCT_CATEGORIES } from '@/lib/catalogCategories';

import {

  dedupeBouquetsById,

  filterBouquetsCatalogData,

  interleavePopularCatalogItems,

  mulberry32,

  orderPopularBouquetsWithFeaturedFirst,

  shuffleArraySeeded,

  sortCatalogProducts,

  getPopularShuffleSeed,

  type CatalogFilterParams,

  type PopularCatalogItem,

} from '@/lib/catalogListLogic';

import { loadBouquetVariantImages } from '@/lib/catalog/bouquetImages';

import {

  mapBouquetRowToBouquet,

  mapPartnerRowToPartner,

  mapProductRowToCatalogProduct,

} from '@/lib/catalog/mappers';

import { filterStorefrontCatalogStoredImages, isStorefrontCatalogImage } from '@/lib/catalog/storefrontImages';
import { storedImagePublicUrl } from '@/lib/catalog/storage';

import type {

  CatalogBouquetRow,

  CatalogPartnerRow,

  CatalogProductRow,

  CatalogSiteSettingsRow,

  CatalogStoredImage,

} from '@/lib/catalog/types';

import type { DeliveryDestinationId } from '@/lib/delivery/markets';

import type { CatalogProduct } from '@/lib/catalog/types';

import { cacheSupabaseCatalog } from '@/lib/catalogCache';

import { isDatabaseConfigured } from '@/lib/db/client';
import * as catalogDb from '@/lib/db/catalogRead';

export type {

  Bouquet,

  BouquetStatus,

  Partner,

  PartnerStatus,

  BouquetSellableOption,

  PricingType,

  CatalogProduct,

  CatalogStoredImage,

  CatalogPortrait,

  CatalogBouquetPricing,

  CatalogPartnerRow,

  CatalogBouquetRow,

  CatalogProductRow,

  CatalogSiteSettingsRow,

} from '@/lib/catalog/types';

export type { CatalogFilterParams, PopularCatalogItem } from '@/lib/catalogListLogic';

const HERO_IMAGE_FALLBACK = '/HeroImage/heroimage.webp';

/** Storefront catalog reads Postgres when DATABASE_URL is set. */

export function isCatalogReadFromSupabase(): boolean {
  return isDatabaseConfigured();
}

function requireDatabase(): void {
  if (!isDatabaseConfigured()) {
    throw new Error('Missing DATABASE_URL — configure Postgres on the Timeweb VPS.');
  }
}

async function mapBouquetRowWithImages(
  row: CatalogBouquetRow,
  partner: CatalogPartnerRow | null,
  localeSlug?: string
): Promise<Bouquet> {
  try {
    const { main, byVariantKey } = await loadBouquetVariantImages(row.id);
    return mapBouquetRowToBouquet(row, partner, localeSlug, {

      mainImages: main.urls.length > 0 ? main : undefined,

      variantImages: byVariantKey,

    });

  } catch (err) {

    console.error('[catalog] variant images load failed:', err);

    return mapBouquetRowToBouquet(row, partner, localeSlug);

  }

}

async function loadPartnersByIds(ids: string[]): Promise<Map<string, CatalogPartnerRow>> {
  requireDatabase();
  return catalogDb.loadPartnersByIds(ids);
}

async function mapBouquetRows(rows: CatalogBouquetRow[]): Promise<Bouquet[]> {
  requireDatabase();
  const partnerIds = Array.from(
    new Set(rows.map((r) => r.partner_id).filter((id): id is string => Boolean(id)))
  );
  const partnerMap = await loadPartnersByIds(partnerIds);
  return rows.map((row) =>
    mapBouquetRowToBouquet(row, row.partner_id ? partnerMap.get(row.partner_id) : null)
  );
}

async function fetchApprovedBouquetRows(): Promise<CatalogBouquetRow[]> {
  requireDatabase();
  return catalogDb.fetchApprovedBouquetRows();
}

const loadApprovedBouquets = cacheSupabaseCatalog('approved-bouquets', async () => {

  const rows = await fetchApprovedBouquetRows();

  return mapBouquetRows(rows);

});

async function getApprovedBouquets(): Promise<Bouquet[]> {

  return loadApprovedBouquets();

}

async function fetchLiveProductRows(): Promise<CatalogProductRow[]> {
  requireDatabase();
  return catalogDb.fetchLiveProductRows();
}

const loadLiveProducts = cacheSupabaseCatalog('live-products', async () => {
  const rows = await fetchLiveProductRows();
  return rows.map((row) => mapProductRowToCatalogProduct(row));
});

async function getLiveProducts(): Promise<CatalogProduct[]> {

  return loadLiveProducts();

}

function productCreatedAtMap(rows: CatalogProductRow[]): Map<string, string> {

  return new Map(rows.map((r) => [r.id, r.created_at ?? '']));

}

export async function getBouquetsFromCatalog(): Promise<Bouquet[]> {

  const bouquets = await getApprovedBouquets();

  return dedupeBouquetsById(bouquets).sort((a, b) =>

    (a.nameEn || '').localeCompare(b.nameEn || '', undefined, { sensitivity: 'base' })

  );

}

export async function getBouquetsFromCatalogPaginated(

  start: number,

  limit: number,

  catalogDestination: DeliveryDestinationId = 'CHIANG_MAI'

): Promise<Bouquet[]> {

  const bouquets = dedupeBouquetsById(await getApprovedBouquets())

    .filter((b) => bouquetIsAvailableForDestination(b, catalogDestination))

    .sort((a, b) =>

      (a.nameEn || '').localeCompare(b.nameEn || '', undefined, { sensitivity: 'base' })

    );

  const safeStart = Math.max(0, start);

  return bouquets.slice(safeStart, safeStart + limit);

}

export async function getBouquetBySlugFromCatalog(
  slug: string,
  locale: 'en' | 'th' = 'en'
): Promise<Bouquet | null> {
  requireDatabase();
  const row = await catalogDb.fetchBouquetBySlug(slug, locale);
  if (!row) return null;
  const partner = row.partner_id ? await catalogDb.fetchPartnerById(row.partner_id) : null;
  return mapBouquetRowWithImages(row, partner, slug);
}

export async function getBouquetByLegacySanityId(legacyId: string): Promise<Bouquet | null> {
  requireDatabase();
  const row = await catalogDb.fetchBouquetByLegacyImportId(legacyId);
  if (!row) return null;
  const partner = row.partner_id ? await catalogDb.fetchPartnerById(row.partner_id) : null;
  return mapBouquetRowWithImages(row, partner);
}

export async function getBouquetByIdFromCatalog(bouquetId: string): Promise<Bouquet | null> {
  requireDatabase();
  let row = await catalogDb.fetchBouquetById(bouquetId);
  if (!row) return getBouquetByLegacySanityId(bouquetId);
  const partner = row.partner_id ? await catalogDb.fetchPartnerById(row.partner_id) : null;
  return mapBouquetRowWithImages(row, partner);
}

export async function getBouquetsCatalogDataFromCatalog(

  params: CatalogFilterParams

): Promise<{ bouquets: Bouquet[]; allBouquets: Bouquet[] }> {

  const all = dedupeBouquetsById(await getApprovedBouquets());

  return filterBouquetsCatalogData(all, params);

}

export async function getBouquetsFilteredFromCatalog(params: CatalogFilterParams): Promise<Bouquet[]> {

  const { bouquets } = await getBouquetsCatalogDataFromCatalog(params);

  return bouquets;

}

async function getOrderedPopularBouquetsFromCatalog(): Promise<Bouquet[]> {

  const bouquets = (await getApprovedBouquets()).filter((b) =>

    bouquetIsAvailableForDestination(b, 'CHIANG_MAI')

  );

  return orderPopularBouquetsWithFeaturedFirst(bouquets);

}

export async function getPopularBouquetsFromCatalogPaginated(

  start: number,

  limit: number

): Promise<Bouquet[]> {

  const ordered = await getOrderedPopularBouquetsFromCatalog();

  const safeStart = Math.max(0, start);

  return ordered.slice(safeStart, safeStart + limit);

}

const loadPopularCatalogItemsFull = cacheSupabaseCatalog('popular-catalog-items-full', async () => {

  const productCategoryKeys = PRODUCT_CATEGORIES.filter(

    (category) => category !== 'plushy_toys' && category !== 'balloons'

  );

  requireDatabase();
  const productRows = await fetchLiveProductRows();
  const createdAtById = productCreatedAtMap(productRows);
  const allProducts = productRows.map((row) => mapProductRowToCatalogProduct(row));

  const bouquets = await getOrderedPopularBouquetsFromCatalog();

  const plushyToys = sortCatalogProducts(

    allProducts.filter((p) => p.category === 'plushy_toys'),

    'newest',

    createdAtById

  );

  const balloons = sortCatalogProducts(

    allProducts.filter((p) => p.category === 'balloons'),

    'newest',

    createdAtById

  );

  const productGroups = productCategoryKeys.map((categoryKey) =>

    sortCatalogProducts(

      allProducts.filter(

        (p) =>

          p.category === categoryKey &&

          bouquetIsAvailableForDestination(p, 'CHIANG_MAI')

      ),

      'newest',

      createdAtById

    )

  );

  const rng = mulberry32(getPopularShuffleSeed() + 17);

  const flowerItems: PopularCatalogItem[] = bouquets.map((item) => ({

    itemType: 'bouquet' as const,

    item,

  }));

  const productItems: PopularCatalogItem[] = [

    ...plushyToys.map((item) => ({ itemType: 'product' as const, item })),

    ...balloons.map((item) => ({ itemType: 'product' as const, item })),

    ...productGroups.flat().map((item) => ({ itemType: 'product' as const, item })),

  ];

  return [

    ...flowerItems,

    ...interleavePopularCatalogItems(shuffleArraySeeded(productItems, rng)),

  ];

});

export async function getPopularCatalogItemsFromCatalogPaginated(

  start: number,

  limit: number

): Promise<PopularCatalogItem[]> {

  const mixed = await loadPopularCatalogItemsFull();

  const safeStart = Math.max(0, start);

  return mixed.slice(safeStart, safeStart + limit);

}

export async function getProductsFromCatalog(): Promise<CatalogProduct[]> {

  return getLiveProducts();

}

export async function getProductsFilteredFromCatalog(params: {

  categoryKey: string;

  sort?: 'newest' | 'price_asc' | 'price_desc';

  catalogDeliveryDestination?: DeliveryDestinationId;

}): Promise<CatalogProduct[]> {

  const { categoryKey, sort = 'newest', catalogDeliveryDestination } = params;

  requireDatabase();
  const rows = await fetchLiveProductRows();
  const createdAtById = productCreatedAtMap(rows);
  const mapped = rows
    .filter((r) => r.category === categoryKey)
    .map((row) => mapProductRowToCatalogProduct(row))

    .filter((p) =>

      catalogDeliveryDestination

        ? bouquetIsAvailableForDestination(p, catalogDeliveryDestination)

        : true

    );

  return sortCatalogProducts(mapped, sort, createdAtById);

}

export async function getProductBySlugFromCatalog(

  slug: string,

  locale: 'en' | 'th' = 'en'

): Promise<CatalogProduct | null> {

  const products = await getLiveProducts();

  const match = products.find((p) => p.slug === slug);

  if (match) return match;

  requireDatabase();
  const row = await catalogDb.fetchProductBySlug(slug, locale);
  if (!row) return null;
  return mapProductRowToCatalogProduct(row, slug);

}

export async function getPlushyToysFilteredFromCatalog(params: {

  sort?: 'newest' | 'price_asc' | 'price_desc';

}): Promise<CatalogProduct[]> {

  return getProductsFilteredFromCatalog({

    categoryKey: 'plushy_toys',

    sort: params.sort ?? 'newest',

  });

}

export async function getBalloonsFilteredFromCatalog(params: {

  sort?: 'newest' | 'price_asc' | 'price_desc';

}): Promise<CatalogProduct[]> {

  return getProductsFilteredFromCatalog({

    categoryKey: 'balloons',

    sort: params.sort ?? 'newest',

  });

}

export async function getPlushyToyBySlugFromCatalog(slug: string): Promise<CatalogProduct | null> {

  const toys = await getPlushyToysFilteredFromCatalog({ sort: 'newest' });

  return toys.find((p) => p.slug === slug) ?? null;

}

export async function getBalloonBySlugFromCatalog(slug: string): Promise<CatalogProduct | null> {

  const balloons = await getBalloonsFilteredFromCatalog({ sort: 'newest' });

  return balloons.find((p) => p.slug === slug) ?? null;

}

type StripeProductPricing = {

  id: string;

  nameEn: string;

  nameTh?: string;

  price: number;

  discountPercent?: number;

  sizeLabel?: string;

  imageUrl?: string;

};

async function fetchProductRowById(productId: string): Promise<CatalogProductRow | null> {
  requireDatabase();
  return catalogDb.fetchProductRowById(productId);
}

function mapRowToStripeProductPricing(row: CatalogProductRow): StripeProductPricing {
  const product = mapProductRowToCatalogProduct(row);

  return {

    id: product.id,

    nameEn: product.nameEn,

    nameTh: product.nameTh,

    price: product.price,

    discountPercent: product.discountPercent,

    sizeLabel: product.sizeLabel,

    imageUrl: product.images[0],

  };

}

export async function getProductByIdFromCatalog(productId: string): Promise<{

  id: string;

  nameEn: string;

  nameTh?: string;

  descriptionEn?: string;

  descriptionTh?: string;

  category: string;

  price: number;

  cost?: number;

  commissionPercent?: number;

  discountPercent?: number;

  moderationStatus: string;

  imageUrl?: string;

  imageRefs: string[];

  preparationTime?: number;

  occasion?: string;

  excludedDeliveryDestinations?: DeliveryDestinationId[];

  partnerId?: string;

} | null> {

  const row = await fetchProductRowById(productId);

  if (!row) return null;

  const product = mapProductRowToCatalogProduct(row);

  return {

    id: product.id,

    nameEn: product.nameEn,

    nameTh: product.nameTh,

    descriptionEn: product.descriptionEn,

    descriptionTh: product.descriptionTh,

    category: product.category,

    price: product.price,

    cost: product.cost,

    commissionPercent: product.commissionPercent,

    discountPercent: product.discountPercent,

    moderationStatus: row.moderation_status,

    imageUrl: product.images[0],

    imageRefs: (row.images ?? []).map((img) => img.storage_path).filter(Boolean),

    preparationTime: product.preparationTime,

    occasion: product.occasion,

    excludedDeliveryDestinations: product.excludedDeliveryDestinations,

    partnerId: row.partner_id,

  };

}

export async function getPlushyToyByIdFromCatalog(id: string): Promise<StripeProductPricing | null> {

  const row = await fetchProductRowById(id);

  if (!row || row.category !== 'plushy_toys') return null;

  return mapRowToStripeProductPricing(row);

}

export async function getBalloonByIdFromCatalog(id: string): Promise<StripeProductPricing | null> {

  const row = await fetchProductRowById(id);

  if (!row || row.category !== 'balloons') return null;

  return mapRowToStripeProductPricing(row);

}

export async function getPartnerFromCatalog(partnerId: string): Promise<Partner | null> {
  requireDatabase();
  const data = await catalogDb.fetchPartnerById(partnerId);
  if (!data) return null;
  return mapPartnerRowToPartner(data);
}

async function fetchHeroImageUncached(): Promise<string> {
  requireDatabase();
  const data = await catalogDb.fetchSiteSettings();
  const hero = data?.hero_image as CatalogStoredImage | null;
  if (hero?.storage_path && isStorefrontCatalogImage(hero)) {
    return storedImagePublicUrl(hero);
  }
  return HERO_IMAGE_FALLBACK;
}

const loadHeroImage = cacheSupabaseCatalog('hero-image', fetchHeroImageUncached);

export async function getHeroImageFromCatalog(): Promise<string> {
  return loadHeroImage();
}

const loadHeroCarousel = cacheSupabaseCatalog('hero-carousel', async () => {
  requireDatabase();
  const data = await catalogDb.fetchSiteSettings();
  const images = filterStorefrontCatalogStoredImages(
    (data?.hero_carousel_images ?? []) as CatalogStoredImage[]
  );
  return images
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => storedImagePublicUrl(img));
});

export async function getHeroCarouselImagesFromCatalog(): Promise<string[]> {
  return loadHeroCarousel();
}

