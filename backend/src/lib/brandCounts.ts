import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { toSlug } from './productSlug';

export async function syncBrandCounts(): Promise<void> {
  const distinctBrands: string[] = await Product.distinct('brand');
  for (const brandName of distinctBrands) {
    const count = await Product.countDocuments({ brand: brandName });
    const slug = toSlug(brandName);
    await Brand.findOneAndUpdate(
      { slug },
      { $set: { name: brandName, slug, productCount: count, logoText: brandName.toUpperCase(), heroColor: '#18181b' } },
      { upsert: true },
    );
  }
}
