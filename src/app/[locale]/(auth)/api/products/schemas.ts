import { z } from 'zod';

// Schema for product creation/input
export const productSchema = z.object({
  maHang: z.string().min(1).max(100),
  tenHang: z.string().min(1).max(255),
  ghiChu: z.string().optional(),
  nhomHang: z.string().optional(),
  vietTat: z.string().optional(),
});

// Schema for product updates (partial)
export const productUpdateSchema = productSchema.partial();

// Extended schema for products returned from database
export const productResponseSchema = productSchema.extend({
  id: z.number(),
  stt: z.number(),
  nguoiThucHien: z.string().min(1),
  ngayTao: z.string().or(z.date()),
  ngayCapNhat: z.string().or(z.date()),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type Product = z.infer<typeof productResponseSchema>;
