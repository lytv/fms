import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import ProductsPage from '../page';

// Mock the required components and hooks
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}));

// Mock the DataGrid component
vi.mock('@/components/data-grid/DataGrid', () => ({
  DataGrid: vi.fn(({ initialData, onDeleteClick, gridOptions }) => (
    <div data-testid="mock-data-grid">
      <div data-testid="row-count">{initialData.length}</div>
      <button
        data-testid="select-row"
        onClick={() => {
          // Simulate row selection
          const selectedRow = initialData[0];
          if (selectedRow) {
            onDeleteClick([selectedRow]);
          }
        }}
      >
        Select Row
      </button>
      <button
        data-testid="select-multiple-rows"
        onClick={() => {
          // Simulate multiple row selection
          if (initialData.length >= 2) {
            onDeleteClick([initialData[0], initialData[1]]);
          }
        }}
      >
        Select Multiple Rows
      </button>
      <button
        data-testid="select-specific-row"
        onClick={() => {
          // Simulate selecting a specific row by id
          const rowId = 2; // Selecting row with id 2
          const selectedRow = initialData.find((row: Record<string, any>) => row.id === rowId);
          if (selectedRow) {
            onDeleteClick([selectedRow]);
          }
        }}
      >
        Select Specific Row
      </button>
      <div data-testid="row-selection-type">{gridOptions?.rowSelection}</div>
    </div>
  )),
  type: {
    ColumnDef: vi.fn(),
  },
}));

// Mock the dialogs
vi.mock('@/components/products/DeleteConfirmationDialog', () => ({
  DeleteConfirmationDialog: vi.fn(({ isOpen, onConfirm, itemCount }) => (
    isOpen
      ? (
          <div data-testid="delete-dialog">
            <span data-testid="item-count">{itemCount}</span>
            <button data-testid="confirm-delete" onClick={onConfirm}>
              Confirm Delete
            </button>
          </div>
        )
      : null
  )),
}));

vi.mock('@/components/products/ProductForm', () => ({
  ProductForm: vi.fn(() => <div data-testid="product-form"></div>),
}));

vi.mock('@/features/dashboard/TitleBar', () => ({
  TitleBar: vi.fn(() => <div data-testid="title-bar"></div>),
}));

// Mock fetch
globalThis.fetch = vi.fn();

// Mock product data
const mockProducts = [
  {
    id: 1,
    stt: 1,
    maHang: 'P001',
    tenHang: 'Product 1',
    ghiChu: 'Test notes',
    nhomHang: 'Test category',
    vietTat: 'P1',
    nguoiThucHien: 'user123',
    ngayTao: '2023-01-01T00:00:00Z',
    ngayCapNhat: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    stt: 2,
    maHang: 'P002',
    tenHang: 'Product 2',
    ghiChu: 'Test notes 2',
    nhomHang: 'Test category 2',
    vietTat: 'P2',
    nguoiThucHien: 'user123',
    ngayTao: '2023-01-02T00:00:00Z',
    ngayCapNhat: '2023-01-02T00:00:00Z',
  },
];

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch for products
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: mockProducts,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
    });
  });

  it('should render the ProductsPage with DataGrid', async () => {
    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });
  });

  it('should open delete dialog when a row is selected and delete button is clicked', async () => {
    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Click select row button to simulate row selection
    fireEvent.click(screen.getByTestId('select-row'));

    // Check if delete dialog is open
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });
  });

  it('should open delete dialog with correct count when multiple rows are selected', async () => {
    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Click select multiple rows button
    fireEvent.click(screen.getByTestId('select-multiple-rows'));

    // Check if delete dialog is open with correct count
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('item-count')).toHaveTextContent('2');
    });
  });

  it('should send delete request when delete is confirmed', async () => {
    // Mock successful delete
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: mockProducts,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Click select row button to simulate row selection
    fireEvent.click(screen.getByTestId('select-row'));

    // Wait for delete dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    // Click confirm delete button
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Check if delete request was sent
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });
    });
  });

  it('should handle delete errors gracefully', async () => {
    // First mock the initial product fetch
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: mockProducts,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      })
      // Then mock a failed delete
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete product' }),
      });

    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Click select row button to simulate row selection
    fireEvent.click(screen.getByTestId('select-row'));

    // Wait for delete dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    // Click confirm delete button
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Check if error is handled
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/products/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });
    });
  });

  it('should use multiple row selection for DataGrid', async () => {
    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Check if row selection type is set to 'multiple'
    expect(screen.getByTestId('row-selection-type')).toHaveTextContent('multiple');
  });

  it('should select a specific row correctly', async () => {
    // Mock successful fetch for products and delete
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: mockProducts,
          page: 1,
          limit: 10,
          totalPages: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<ProductsPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Click select specific row button to simulate selecting row with id 2
    fireEvent.click(screen.getByTestId('select-specific-row'));

    // Wait for delete dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('item-count')).toHaveTextContent('1');
    });

    // Click confirm delete button
    fireEvent.click(screen.getByTestId('confirm-delete'));

    // Check if the correct product ID was used in the delete request
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/products/2', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });
    });
  });
});
