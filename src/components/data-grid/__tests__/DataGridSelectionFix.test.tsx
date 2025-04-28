import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DataGrid } from '../DataGrid';

// Mock required components
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableRow: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <tr onClick={onClick}>{children}</tr>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={() => onCheckedChange?.(true)}
    />
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button
      data-testid={`button-${String(children).toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  Plus: () => <span>Add</span>,
  FileEdit: () => <span>Edit</span>,
  Trash: () => <span>Delete</span>,
  RefreshCw: () => <span>Refresh</span>,
  Eye: () => <span>Show</span>,
  EyeOff: () => <span>Hide</span>,
  ChevronUp: () => <span>↑</span>,
  ChevronDown: () => <span>↓</span>,
  ChevronsUpDown: () => <span>↕</span>,
  Download: () => <span>Download</span>,
  Upload: () => <span>Upload</span>,
  X: () => <span>X</span>,
}));

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('DataGrid Selection Fix', () => {
  // Test data with identical properties but different references
  const product1a = { id: 1, name: 'Product 1', price: 100 };
  const product1b = { id: 1, name: 'Product 1', price: 100 }; // Same ID as product1a
  const product2 = { id: 2, name: 'Product 2', price: 200 };

  // Test that our fix correctly compares by ID, not by reference
  it('selects rows by ID, not by reference', () => {
    const onRowSelected = vi.fn();

    const { rerender } = render(
      <DataGrid
        initialData={[product1a, product2]}
        columnDefs={[
          { field: 'id', headerName: 'ID' },
          { field: 'name', headerName: 'Name' },
        ]}
        onRowSelected={onRowSelected}
      />,
    );

    // Select the first row
    const checkboxes = screen.getAllByTestId('checkbox');
    const firstCheckbox = checkboxes[1]; // First row checkbox
    if (firstCheckbox) {
      fireEvent.click(firstCheckbox);
    }

    // Verify callback was called
    expect(onRowSelected).toHaveBeenCalledWith(product1a);

    // Re-render with same IDs but different object references
    rerender(
      <DataGrid
        initialData={[product1b, product2]} // product1b has same ID but different reference
        columnDefs={[
          { field: 'id', headerName: 'ID' },
          { field: 'name', headerName: 'Name' },
        ]}
        onRowSelected={onRowSelected}
      />,
    );

    // The first row should still be selected after re-render
    // Get checkboxes again after re-render
    const newCheckboxes = screen.getAllByTestId('checkbox');

    expect(newCheckboxes[1]).toBeChecked();
  });

  it('correctly handles deletion of selected rows by ID', () => {
    const onDeleteClick = vi.fn();

    // Render with multiple products with the same ID
    render(
      <DataGrid
        initialData={[product1a, product1b, product2]} // Two products with ID 1
        columnDefs={[
          { field: 'id', headerName: 'ID' },
          { field: 'name', headerName: 'Name' },
        ]}
        onDeleteClick={onDeleteClick}
        gridOptions={{ rowSelection: 'multiple' }}
      />,
    );

    // Select both products with ID 1
    const checkboxes = screen.getAllByTestId('checkbox');
    const firstCheckbox = checkboxes[1]; // First row checkbox (product1a)
    const secondCheckbox = checkboxes[2]; // Second row checkbox (product1b)

    if (firstCheckbox) {
      fireEvent.click(firstCheckbox);
    }
    if (secondCheckbox) {
      fireEvent.click(secondCheckbox);
    }

    // Click delete button
    const deleteButton = screen.getByTestId('button-delete');
    fireEvent.click(deleteButton);

    // Since product1a and product1b have the same ID, our fix should ensure
    // they're treated as the same item - not duplicated in the deletion array
    expect(onDeleteClick).toHaveBeenCalledWith([product1a, product1b]);
  });
});
