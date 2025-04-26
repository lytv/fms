import type { ColDef } from 'ag-grid-community';
import React, { useState } from 'react';

import { DataGrid } from '@/components/data-grid/DataGrid';

type ProductData = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

const initialData: ProductData[] = [
  { id: 1, name: 'Product A', category: 'Electronics', price: 1200, stock: 50 },
  { id: 2, name: 'Product B', category: 'Books', price: 25, stock: 120 },
  { id: 3, name: 'Product C', category: 'Electronics', price: 850, stock: 30 },
  { id: 4, name: 'Product D', category: 'Clothing', price: 45, stock: 80 },
  { id: 5, name: 'Product E', category: 'Books', price: 35, stock: 60 },
];

const DataGridExample: React.FC = () => {
  const [data, setData] = useState<ProductData[]>(initialData);

  // Define column definitions with filters
  const columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      filter: 'agNumberColumnFilter', // Number filter
      editable: false,
    },
    {
      field: 'name',
      headerName: 'Product Name',
      flex: 1,
      filter: 'agTextColumnFilter', // Text filter
    },
    {
      field: 'category',
      headerName: 'Category',
      filter: 'agSetColumnFilter', // Set filter (dropdown)
      width: 150,
    },
    {
      field: 'price',
      headerName: 'Price',
      width: 120,
      filter: 'agNumberColumnFilter', // Number filter
      valueFormatter: (params) => {
        return params.value ? `$${params.value.toLocaleString()}` : '';
      },
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 120,
      filter: 'agNumberColumnFilter', // Number filter
    },
  ];

  // Define callback functions for edit and delete actions
  const handleAddClick = () => {
    // Example of adding a new row
    const newId = Math.max(...data.map(item => item.id)) + 1;
    const newRow: ProductData = {
      id: newId,
      name: `New Product ${newId}`,
      category: 'New Category',
      price: 0,
      stock: 0,
    };
    setData([...data, newRow]);
  };

  const handleEditClick = (_rowData: Record<string, any>) => {
    // Example of editing a row (in a real app, this would open a form or dialog)
    // Implement your edit logic here
  };

  const handleDeleteClick = (rowsToDelete: Record<string, any>[]) => {
    // Filter out the rows that match the ids in rowsToDelete
    const idsToDelete = rowsToDelete.map(row => row.id);
    const newData = data.filter(row => !idsToDelete.includes(row.id));
    setData(newData);
  };

  const handleDataChange = (newData: Record<string, any>[]) => {
    // Type assertion since we know the shape of the data
    setData(newData as ProductData[]);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Product Inventory</h1>
      <DataGrid
        initialData={data}
        columnDefs={columnDefs}
        onDataChange={handleDataChange}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        exportFileName="product-inventory.xlsx"
      />
    </div>
  );
};

export default DataGridExample;
