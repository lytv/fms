'use client';

import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { Product, ProductUpdate } from '@/app/[locale]/(auth)/api/products/schemas';
import { type ColumnDef, DataGrid } from '@/components/data-grid/DataGrid';
import { DeleteConfirmationDialog } from '@/components/products/DeleteConfirmationDialog';
import { ProductForm } from '@/components/products/ProductForm';
import { TitleBar } from '@/features/dashboard/TitleBar';

export default function ProductsPage() {
  const t = useTranslations('Products');
  const { getToken } = useAuth();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Column definitions for the DataGrid
  const columnDefs = useMemo<ColumnDef[]>(
    () => [
      {
        field: 'id',
        headerName: t('id'),
        width: 80,
        sortable: true,
        filter: true,
      },
      {
        field: 'maHang',
        headerName: t('product_code'),
        minWidth: 150,
        filter: true,
      },
      {
        field: 'tenHang',
        headerName: t('product_name'),
        minWidth: 200,
        filter: true,
      },
      {
        field: 'nhomHang',
        headerName: t('product_category'),
        minWidth: 150,
        filter: true,
      },
      {
        field: 'vietTat',
        headerName: t('product_abbreviation'),
        minWidth: 140,
        filter: true,
      },
      {
        field: 'ghiChu',
        headerName: t('product_notes'),
        minWidth: 200,
        filter: true,
      },
      {
        field: 'ngayTao',
        headerName: t('created_at'),
        minWidth: 160,
        valueFormatter: (params) => {
          if (!params.value) {
            return '';
          }
          return new Date(params.value).toLocaleString();
        },
        filter: true,
      },
      {
        field: 'ngayCapNhat',
        headerName: t('updated_at'),
        minWidth: 160,
        valueFormatter: (params) => {
          if (!params.value) {
            return '';
          }
          return new Date(params.value).toLocaleString();
        },
        filter: true,
      },
    ],
    [t],
  );

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      floatingFilter: true,
    }),
    [],
  );

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(
        `/api/products?page=${pagination.page}&limit=${pagination.limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(t('fetch_error'));
    } finally {
      setIsLoading(false);
    }
  }, [getToken, pagination.page, pagination.limit, t]);

  // Create a new product
  const createProduct = useCallback(
    async (productData: ProductUpdate) => {
      try {
        setIsLoading(true);
        const token = await getToken();

        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create product');
        }

        // Close dialog and refresh data
        toast.success(t('create_success'));
        setIsCreateDialogOpen(false);
        fetchProducts();
      } catch (error) {
        console.error('Error creating product:', error);
        toast.error(t('create_error'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProducts, getToken, t],
  );

  // Update an existing product
  const updateProduct = useCallback(
    async (id: number, productData: ProductUpdate) => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update product');
        }

        // Close dialog and refresh data
        toast.success(t('update_success'));
        setIsEditDialogOpen(false);
        fetchProducts();
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error(t('update_error'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProducts, getToken, t],
  );

  // Delete products
  const deleteProducts = useCallback(
    async (ids: number[]) => {
      try {
        setIsLoading(true);
        const token = await getToken();

        // Delete each product sequentially
        for (const id of ids) {
          const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete product');
          }
        }

        // Close dialog and refresh data
        const message
          = ids.length === 1
            ? t('delete_success_single')
            : t('delete_success_multiple', { count: ids.length });
        toast.success(message);
        setIsDeleteDialogOpen(false);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting products:', error);
        toast.error(t('delete_error'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProducts, getToken, t],
  );

  // Handlers
  const handleCreateSubmit = (data: ProductUpdate) => {
    createProduct(data);
  };

  const handleEditSubmit = (data: ProductUpdate) => {
    if (currentProduct) {
      updateProduct(currentProduct.id, data);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedProducts.length > 0) {
      deleteProducts(selectedProducts.map(p => p.id));
    }
  };

  const handleEditClick = (data: Record<string, any>) => {
    // Convert from Record<string, any> to Product
    const product = data as unknown as Product;
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (data: Record<string, any>[]) => {
    // Convert from Record<string, any>[] to Product[]
    const products = data as unknown as Product[];
    // Ensure we have unique products based on ID
    const uniqueProducts = Array.from(
      new Map(products.map(product => [product.id, product])).values(),
    );
    setSelectedProducts(uniqueProducts);
    setIsDeleteDialogOpen(true);
  };

  // Load products on initial render
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <TitleBar
        title={t('title')}
        description={t('description')}
      />

      <div className="mt-6 rounded-lg bg-card p-4 shadow">
        <DataGrid
          initialData={products}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          showToolbar
          exportFileName="products-export.xlsx"
          className="min-h-[500px]"
          gridOptions={{
            pagination: true,
            paginationPageSize: pagination.limit,
            rowSelection: 'multiple',
            suppressRowClickSelection: true,
            domLayout: 'autoHeight',
          }}
          onAddClick={() => setIsCreateDialogOpen(true)}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onRefreshClick={fetchProducts}
          isLoading={isLoading}
        />
      </div>

      {/* Create Product Dialog */}
      <ProductForm
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isLoading}
        title={t('create_product')}
      />

      {/* Edit Product Dialog */}
      <ProductForm
        key={currentProduct ? `edit-${currentProduct.id}` : 'create'}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={currentProduct || {}}
        isLoading={isLoading}
        title={t('edit_product')}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
        itemCount={selectedProducts.length}
      />
    </>
  );
}
