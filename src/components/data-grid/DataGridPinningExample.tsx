import React, { useEffect, useState } from 'react';

import type { ColumnDef } from './DataGrid';
import { DataGrid } from './DataGrid';

// Sample data
const data = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  email: `person${i + 1}@example.com`,
  age: Math.floor(Math.random() * 50) + 18,
  city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'][Math.floor(Math.random() * 5)],
  salary: Math.floor(Math.random() * 100000) + 30000,
  department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][Math.floor(Math.random() * 5)],
  startDate: new Date(Date.now() - Math.floor(Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)),
  active: Math.random() > 0.3,
}));

// Local storage key
const STORAGE_KEY = 'dataGridPinningExample';

export const DataGridPinningExample: React.FC = () => {
  const [columnDefs] = useState<ColumnDef[]>([
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      pinned: 'left', // Default pinned left
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      filter: true,
    },
    {
      field: 'age',
      headerName: 'Age',
      width: 100,
    },
    {
      field: 'city',
      headerName: 'City',
      width: 150,
    },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 150,
      valueFormatter: ({ value }) => {
        return `$${value.toLocaleString()}`;
      },
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 180,
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 150,
    },
    {
      field: 'active',
      headerName: 'Active',
      width: 120,
      pinned: 'right', // Default pinned right
    },
  ]);

  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>({
    id: 'left',
    active: 'right',
  });

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  // Load pinning state from localStorage on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const { pinning, visibility } = JSON.parse(savedState);
        if (pinning) {
          setPinnedColumns(pinning);
        }
        if (visibility) {
          setColumnVisibility(visibility);
        }
      }
    } catch (error) {
      console.error('Error loading saved grid state:', error);
    }
  }, []);

  // Save pinning state to localStorage when it changes
  const savePinningState = (
    pinning: Record<string, 'left' | 'right' | null>,
    visibility?: Record<string, boolean>,
  ) => {
    try {
      const stateToSave = {
        pinning,
        visibility: visibility || columnVisibility,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving grid state:', error);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">DataGrid Column Pinning Example</h1>
      <div className="mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-700">
          <strong>Usage:</strong>
          {' '}
          Click the pin icon in any column header to pin/unpin columns.
          You can pin columns to the left or right side of the grid.
          Pinned columns remain visible when scrolling horizontally.
        </p>
        <p className="mt-2 text-sm text-yellow-700">
          <strong>Persistence:</strong>
          {' '}
          Column pinning and visibility settings are saved to local storage
          and will be restored when you return to this page.
        </p>
      </div>
      <DataGrid
        initialData={data}
        columnDefs={columnDefs}
        onColumnPinningChange={(newPinning) => {
          setPinnedColumns(newPinning);
          savePinningState(newPinning);
        }}
        onColumnVisibilityChange={(newVisibility) => {
          setColumnVisibility(newVisibility);
          savePinningState(pinnedColumns, newVisibility);
        }}
        className="max-w-full"
      />
      <div className="mt-4 rounded bg-gray-50 p-4">
        <h2 className="mb-2 font-semibold">Current Pinned Columns:</h2>
        <pre className="rounded bg-gray-100 p-3 text-sm">
          {JSON.stringify(pinnedColumns, null, 2)}
        </pre>
      </div>
    </div>
  );
};
