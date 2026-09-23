// Descoberta de fixtures a partir dos dados demo da dev store (via proxy do `theme dev`).
// Nunca pula: se não há produto adequado, falha com a mensagem definida no spec (E2E-06).
import type { APIRequestContext } from '@playwright/test';

export type StoreProduct = {
  handle: string;
  images: unknown[];
  variants: { id: number; price: string; option1: string | null; option2: string | null; option3: string | null }[];
  options: { name: string; values: string[] }[];
};

export async function listProducts(request: APIRequestContext): Promise<StoreProduct[]> {
  const res = await request.get('/products.json?limit=250');
  if (!res.ok()) throw new Error(`GET /products.json falhou: ${res.status()}`);
  return (await res.json()).products;
}

export async function findProduct(
  request: APIRequestContext,
  predicate: (p: StoreProduct) => boolean,
  missingMessage: string,
): Promise<StoreProduct> {
  const product = (await listProducts(request)).find(predicate);
  if (!product) throw new Error(missingMessage);
  return product;
}

export const hasVariablePrices = (p: StoreProduct) => new Set(p.variants.map((v) => v.price)).size > 1;
export const hasTwoOrMoreImages = (p: StoreProduct) => p.images.length >= 2;

export const FIXTURE_VARIABLE_PRICES = 'Fixture ausente: produto com preços variáveis';
export const FIXTURE_TWO_IMAGES = 'Fixture ausente: produto com 2+ imagens';
