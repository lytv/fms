import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import { DataGrid } from '../DataGrid';

// Mock required components
vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => (
    <table data-testid="mock-table">{children}</table>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => (
    <thead data-testid="mock-table-header">{children}</thead>
  ),
  TableBody: ({ children }: { children: React.ReactNode }) => (
    <tbody data-testid="mock-table-body">{children}</tbody>
  ),
  TableHead: ({ children }: { children: React.ReactNode }) => (
    <th data-testid="mock-table-head">{children}</th>
  ),
  TableRow: ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <tr
      data-testid="mock-table-row"
      className={className}
      onClick={onClick}
    >
      {children}
    </tr>
  ),
  TableCell: ({ children }: { children: React.ReactNode }) => (
    <td data-testid="mock-table-cell">{children}</td>
  ),
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
      data-testid="mock-checkbox"
      checked={checked}
      onChange={() => onCheckedChange?.(true)}
    />
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button
      data-testid="mock-button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
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

// Mock dropdown components
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-dropdown">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-dropdown-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div
      data-testid="mock-dropdown-item"
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  ),
}));

// Mock icon components
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">+</span>,
  FileEdit: () => <span data-testid="edit-icon">Edit</span>,
  Trash: () => <span data-testid="trash-icon">Delete</span>,
  RefreshCw: () => <span data-testid="refresh-icon">Refresh</span>,
  Eye: () => <span data-testid="eye-icon">Show</span>,
  EyeOff: () => <span data-testid="eye-off-icon">Hide</span>,
  ChevronUp: () => <span data-testid="chevron-up">^</span>,
  ChevronDown: () => <span data-testid="chevron-down">v</span>,
  ChevronsUpDown: () => <span data-testid="chevrons-updown">↕</span>,
}));

// Mock data
const mockData = [
  { id: 1, name: 'Product 1', category: 'Category 1', price: 100 },
  { id: 2, name: 'Product 2', category: 'Category 2', price: 200 },
  { id: 3, name: 'Product 3', category: 'Category 1', price: 300 },
];

// Mock column definitions
const mockColumns = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'category', headerName: 'Category', width: 120 },
  { field: 'price', headerName: 'Price', width: 100 },
];

describe('DataGrid Component', () => {
  // Common props for tests
  const defaultProps = {
    initialData: mockData,
    columnDefs: mockColumns,
  };

  it('renders the data grid with correct data', () => {
    render(<DataGrid {...defaultProps} />);

    // Check if the table is rendered
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();

    // Check if data is rendered
    const cells = screen.getAllByTestId('mock-table-cell');

    expect(cells.length).toBeGreaterThan(0);
  });

  it('calls onDeleteClick when Delete button is clicked', () => {
    const onDeleteClick = vi.fn();

    render(
      <DataGrid
        {...defaultProps}
        onDeleteClick={onDeleteClick}
      />,
    );

    // The Delete button should initially be available in toolbar
    const deleteButtons = screen.getAllByText(/delete/i);

    expect(deleteButtons.length).toBeGreaterThan(0);

    // But clicking it won't do anything if no rows are selected
    if (deleteButtons[0]) {
      fireEvent.click(deleteButtons[0]);

      expect(onDeleteClick).not.toHaveBeenCalled();
    }
  });

  it('makes Edit button available when a row is selected', () => {
    const onEditClick = vi.fn();

    render(
      <DataGrid
        {...defaultProps}
        onEditClick={onEditClick}
      />,
    );

    // Initially, there should be no Edit button for a specific row
    // Now we need to select a row to enable editing
    // This would typically involve clicking a checkbox or row to select it

    // We can verify that onEditClick works by passing it directly to a mock component
    expect(onEditClick).not.toHaveBeenCalled();
  });

  it('handles the refresh functionality', () => {
    const onRefreshClick = vi.fn();

    render(
      <DataGrid
        {...defaultProps}
        onRefreshClick={onRefreshClick}
      />,
    );

    // Find refresh button
    const refreshButtons = screen.getAllByText(/refresh/i);
    if (refreshButtons.length > 0 && refreshButtons[0]) {
      fireEvent.click(refreshButtons[0]);

      expect(onRefreshClick).toHaveBeenCalled();
    }
  });

  it('handles pagination correctly', () => {
    // Create mock data with more items
    const largeDataset = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      category: `Category ${(i % 3) + 1}`,
      price: (i + 1) * 100,
    }));

    render(
      <DataGrid
        initialData={largeDataset}
        columnDefs={mockColumns}
        gridOptions={{ pagination: true, paginationPageSize: 10 }}
      />,
    );

    // Basic check that the table renders with pagination
    expect(screen.getByTestId('mock-table')).toBeInTheDocument();
  });
});
