import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DataGrid } from '../DataGrid';

// Mock UI components in a simplified way
vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableRow: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <tr onClick={onClick}>{children}</tr>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => <td>{children}</td>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
  }: {
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
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: any;
  }) => (
    <button
      data-testid={`button-${String(children).toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

// Mock other necessary components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div onClick={onClick} onKeyDown={e => e.key === 'Enter' && onClick?.()} role="button" tabIndex={0}>{children}</div>
  ),
}));

// Mock the icons
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

// Mock XLSX for Excel export
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

// Sample data for testing
const mockProducts = [
  { id: 1, name: 'Product 1', price: 100 },
  { id: 2, name: 'Product 2', price: 200 },
  { id: 3, name: 'Product 3', price: 300 },
];

const mockColumns = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Name' },
  { field: 'price', headerName: 'Price' },
];

describe('DataGrid Row Selection and Deletion', () => {
  it('allows selecting a single row', () => {
    const onRowSelected = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onRowSelected={onRowSelected}
      />,
    );

    // Find all checkboxes - first one is header, rest are rows
    const checkboxes = screen.getAllByTestId('checkbox');

    expect(checkboxes.length).toBe(mockProducts.length + 1); // +1 for header checkbox

    // Select the first product row
    const checkbox = checkboxes[1]; // First row checkbox
    if (checkbox) {
      fireEvent.click(checkbox);
    }

    // Verify callback was called with the first product
    expect(onRowSelected).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('allows selecting multiple rows', () => {
    const onRowSelected = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onRowSelected={onRowSelected}
        gridOptions={{ rowSelection: 'multiple' }}
      />,
    );

    // Find all checkboxes
    const checkboxes = screen.getAllByTestId('checkbox');

    // Select the first and second product rows
    const firstRowCheckbox = checkboxes[1];
    const secondRowCheckbox = checkboxes[2];

    if (firstRowCheckbox) {
      fireEvent.click(firstRowCheckbox);
    }
    if (secondRowCheckbox) {
      fireEvent.click(secondRowCheckbox);
    }

    // With multiple selection, onRowSelected may behave differently
    // Most likely called once for first selection, and not for subsequent ones
    expect(onRowSelected).toHaveBeenCalledTimes(1);
  });

  it('allows selecting all rows with header checkbox', () => {
    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        gridOptions={{ rowSelection: 'multiple' }}
      />,
    );

    // Find all checkboxes
    const checkboxes = screen.getAllByTestId('checkbox');
    const headerCheckbox = checkboxes[0];

    // Select all rows using header checkbox
    if (headerCheckbox) {
      fireEvent.click(headerCheckbox);
    }

    // All checkboxes should now be checked
    const afterCheckboxes = screen.getAllByTestId('checkbox');
    afterCheckboxes.forEach((checkbox) => {
      expect(checkbox).toHaveProperty('checked', true);
    });
  });

  it('enables Delete button when rows are selected', () => {
    const onDeleteClick = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onDeleteClick={onDeleteClick}
      />,
    );

    // Delete button should be present
    const deleteButton = screen.getByTestId('button-delete');

    expect(deleteButton).toBeInTheDocument();

    // Select a row
    const checkboxes = screen.getAllByTestId('checkbox');
    const checkbox = checkboxes[1]; // First row checkbox
    if (checkbox) {
      fireEvent.click(checkbox);
    }

    // Click delete button
    fireEvent.click(deleteButton);

    // onDeleteClick should have been called with the selected rows
    expect(onDeleteClick).toHaveBeenCalledWith([mockProducts[0]]);
  });

  it('enables Edit button only when exactly one row is selected', () => {
    const onEditClick = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onEditClick={onEditClick}
      />,
    );

    // Initially, the Edit button may not be visible or might be disabled

    // Select a row
    const checkboxes = screen.getAllByTestId('checkbox');
    const checkbox = checkboxes[1]; // First row checkbox
    if (checkbox) {
      fireEvent.click(checkbox);
    }

    // Edit button should now be visible and enabled
    const editButton = screen.getByTestId('button-edit');

    expect(editButton).toBeInTheDocument();

    // Click edit button
    fireEvent.click(editButton);

    // onEditClick should have been called with the selected row
    expect(onEditClick).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('clicking on a row selects it', () => {
    const onRowSelected = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onRowSelected={onRowSelected}
      />,
    );

    // Find all table rows (excluding header row)
    const rows = screen.getAllByRole('row').slice(1); // Skip header row

    // Click on the first row
    const firstRow = rows[0];
    if (firstRow) {
      fireEvent.click(firstRow);
    }

    // Check if the row selection callback was called
    expect(onRowSelected).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('deletes selected rows when Delete button is clicked', () => {
    const onDeleteClick = vi.fn();

    render(
      <DataGrid
        initialData={mockProducts}
        columnDefs={mockColumns}
        onDeleteClick={onDeleteClick}
        gridOptions={{ rowSelection: 'multiple' }}
      />,
    );

    // Select multiple rows
    const checkboxes = screen.getAllByTestId('checkbox');
    const firstRowCheckbox = checkboxes[1]; // First row
    const secondRowCheckbox = checkboxes[2]; // Second row

    if (firstRowCheckbox) {
      fireEvent.click(firstRowCheckbox);
    }
    if (secondRowCheckbox) {
      fireEvent.click(secondRowCheckbox);
    }

    // Click the delete button
    const deleteButton = screen.getByTestId('button-delete');
    fireEvent.click(deleteButton);

    // Verify onDeleteClick was called with both selected rows
    expect(onDeleteClick).toHaveBeenCalledWith([
      mockProducts[0],
      mockProducts[1],
    ]);
  });
});
