import { count, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { productsSchema } from '@/models/Schema';

import type { ProductInput, ProductUpdate } from './schemas';

export async function getProducts(page = 1, limit = 10, _userId: string) {
  try {
    const offset = (page - 1) * limit;

    const products = await db
      .select()
      .from(productsSchema)
      .limit(limit)
      .offset(offset)
      .orderBy(productsSchema.id);

    const result = await db
      .select({ value: count() })
      .from(productsSchema);

    const totalCount = result[0]?.value || 0;

    return {
      products,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch products');
  }
}

export async function getProductById(id: string, _userId: string) {
  try {
    const [product] = await db
      .select()
      .from(productsSchema)
      .where(eq(productsSchema.id, Number.parseInt(id, 10)));

    return product;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch product');
  }
}

export async function createProduct(productData: ProductInput, userId: string) {
  try {
    const [product] = await db
      .insert(productsSchema)
      .values({
        maHang: productData.maHang,
        tenHang: productData.tenHang,
        ghiChu: productData.ghiChu,
        nhomHang: productData.nhomHang,
        vietTat: productData.vietTat,
        nguoiThucHien: userId,
      })
      .returning();

    return product;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create product');
  }
}

export async function updateProduct(id: string, productData: ProductUpdate, userId: string) {
  try {
    const [updatedProduct] = await db
      .update(productsSchema)
      .set({
        ...productData,
        nguoiThucHien: userId,
        ngayCapNhat: new Date(),
      })
      .where(eq(productsSchema.id, Number.parseInt(id, 10)))
      .returning();

    return updatedProduct;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(id: string, _userId: string) {
  try {
    await db
      .delete(productsSchema)
      .where(eq(productsSchema.id, Number.parseInt(id, 10)));

    return true;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to delete product');
  }
}
