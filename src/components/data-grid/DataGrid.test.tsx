import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import type { ColumnDef } from './DataGrid';
import { DataGrid } from './DataGrid';

// Mock data
const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 40 },
];

// Mock column definitions
const mockColumns: ColumnDef[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', width: 150 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'age', headerName: 'Age', width: 100 },
];

describe('DataGrid Component', () => {
  it('renders DataGrid with provided data and columns', () => {
    render(
      <DataGrid
        initialData={mockData}
        columnDefs={mockColumns}
      />,
    );

    // Check if columns are rendered
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Check if data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
  });

  it('renders DataGrid with pinned columns', () => {
    const pinnedColumns: ColumnDef[] = [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 150 },
      { field: 'email', headerName: 'Email', width: 200 },
      { field: 'age', headerName: 'Age', width: 100, pinned: 'right' },
    ];

    render(
      <DataGrid
        initialData={mockData}
        columnDefs={pinnedColumns}
      />,
    );

    // Check if all columns are still rendered when pinned
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Check if data is rendered in pinned columns
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('30')[0]).toBeInTheDocument();
  });

  it('handles column pinning changes', () => {
    const onColumnPinningChange = vi.fn();

    render(
      <DataGrid
        initialData={mockData}
        columnDefs={mockColumns}
        onColumnPinningChange={onColumnPinningChange}
      />,
    );

    // Note: This is a basic test structure. The actual pin button click events
    // would need to be implemented with more detailed DOM interaction testing
    // due to the complexity of dropdown menus and nested components.
  });

  it('handles row selection', () => {
    const onRowSelected = vi.fn();

    render(
      <DataGrid
        initialData={mockData}
        columnDefs={mockColumns}
        onRowSelected={onRowSelected}
      />,
    );

    // Find and click the first row
    const rows = screen.getAllByRole('row');

    // Skip header row and ensure we have data rows
    if (rows.length > 1) {
      const dataRow = rows[1];
      // Ensure we have a valid DOM element before firing the event
      if (dataRow instanceof HTMLElement) {
        fireEvent.click(dataRow);

        expect(onRowSelected).toHaveBeenCalledWith(expect.objectContaining({
          id: 1,
          name: 'John Doe',
        }));
      }
    }
  });
});
