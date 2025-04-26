import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { Product } from '@/app/[locale]/(auth)/api/products/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const productFormSchema = z.object({
  maHang: z.string().min(1, 'Mã hàng là bắt buộc').max(100, 'Mã hàng tối đa 100 ký tự'),
  tenHang: z.string().min(1, 'Tên hàng là bắt buộc').max(255, 'Tên hàng tối đa 255 ký tự'),
  ghiChu: z.string().optional(),
  nhomHang: z.string().optional(),
  vietTat: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

type ProductFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<Product>;
  isLoading?: boolean;
  title: string;
  description?: string;
};

export function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  title,
  description,
}: ProductFormProps) {
  const t = useTranslations('Products');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      maHang: initialData?.maHang || '',
      tenHang: initialData?.tenHang || '',
      ghiChu: initialData?.ghiChu || '',
      nhomHang: initialData?.nhomHang || '',
      vietTat: initialData?.vietTat || '',
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maHang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product_code')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enter_product_code')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tenHang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enter_product_name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nhomHang"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product_category')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enter_product_category')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vietTat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product_abbreviation')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enter_product_abbreviation')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ghiChu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('product_notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('enter_product_notes')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
