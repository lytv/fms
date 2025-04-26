import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import { vi } from 'vitest';

import { ProductForm } from '../ProductForm';

// Mock translations
const messages = {
  Products: {
    product_code: 'Product Code',
    product_name: 'Product Name',
    product_category: 'Category',
    product_abbreviation: 'Abbreviation',
    product_notes: 'Notes',
    enter_product_code: 'Enter product code',
    enter_product_name: 'Enter product name',
    enter_product_category: 'Enter product category',
    enter_product_abbreviation: 'Enter product abbreviation',
    enter_product_notes: 'Enter product notes',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
  },
};

// Mock the Dialog component because it uses portals
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}));

describe('ProductForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProductForm
          isOpen
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          title="Test Form"
          isLoading={false}
          {...props}
        />
      </NextIntlClientProvider>,
    );
  };

  describe('Validation', () => {
    it('should show error if required fields are missing', async () => {
      renderComponent();

      // Submit the form without filling required fields
      const submitButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('should validate product code and name are required', async () => {
      renderComponent();

      // Submit form with empty fields
      const submitButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(submitButton);

      // Check for validation errors in specific fields
      await waitFor(() => {
        expect(screen.getByText('Mã hàng là bắt buộc')).toBeInTheDocument();
        expect(screen.getByText('Tên hàng là bắt buộc')).toBeInTheDocument();
      });
    });

    it('should call onSubmit when form is valid', async () => {
      renderComponent();

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText('Enter product code'), {
        target: { value: 'P001' },
      });

      fireEvent.change(screen.getByPlaceholderText('Enter product name'), {
        target: { value: 'Test Product' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(submitButton);

      // Check that onSubmit was called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          maHang: 'P001',
          tenHang: 'Test Product',
          ghiChu: '',
          nhomHang: '',
          vietTat: '',
        });
      });
    });
  });
});
