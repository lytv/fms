# Enhanced DataGrid Component

This enhanced DataGrid component extends the base AG Grid implementation with additional features:

1. **Column Filters** - Displays filter inputs beneath column headers
2. **Action Buttons** - Adds Edit and Delete buttons to each row
3. **Toolbar Controls** - Add, Edit, Delete, Refresh, Export/Import functions
4. **Row Selection** - Supports single and multiple row selection modes with consistent ID-based row identity tracking

## Row Selection and Deletion

The DataGrid component uses ID-based row selection to ensure consistent behavior even when row objects change references. This is important for proper functionality in React applications where props or state updates might create new object references while maintaining the same IDs.

Key behaviors:
- Selected rows are tracked by ID, not by object reference
- The row selection state is maintained correctly across re-renders
- Multiple selection uses checkboxes in the first column
- Row click selection is supported
- Header checkbox for select all/deselect all
- Delete button works with multiple selection

## Basic Usage

See the example implementation in `src/examples/DataGridExample.tsx` for a complete working example.

```tsx
import type { ColDef } from 'ag-grid-community';

import { DataGrid } from '@/components/data-grid/DataGrid';

// Sample data
const data = [
  { id: 1, name: 'Product A', category: 'Electronics', price: 1200 },
  { id: 2, name: 'Product B', category: 'Books', price: 25 },
];

// Column definitions
const columnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    filter: 'agNumberColumnFilter', // Number filter
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
    valueFormatter: params => `$${params.value.toLocaleString()}`,
  },
];
```

Then in your component:

```tsx
import { DataGrid } from '@/components/data-grid/DataGrid';
// Import your columnDefs and data

export function ProductsTable() {
  const handleEditClick = (rowData: Record<string, any>) => {
    // Handle editing the row
  };

  const handleDeleteClick = (rowsToDelete: Record<string, any>[]) => {
    // Handle deleting the rows
  };

  return (
    <DataGrid
      initialData={data}
      columnDefs={columnDefs}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteClick}
    />
  );
}
```

## Filter Types

The component supports all AG Grid filter types:

- `agTextColumnFilter` - For text fields
- `agNumberColumnFilter` - For numeric fields
- `agDateColumnFilter` - For date fields
- `agSetColumnFilter` - Dropdown filter with unique values

## Row Actions

The component automatically adds an Actions column with Edit and Delete buttons when `onEditClick` or `onDeleteClick` props are provided.

## Available Props

| Prop                      | Type                                     | Description                                     |
|---------------------------|------------------------------------------|-------------------------------------------------|
| `initialData`             | `Record<string, any>[]`                  | The initial data to display                     |
| `columnDefs`              | `ColDef[]`                               | Column definitions                              |
| `defaultColDef`           | `ColDef`                                 | Default column properties                       |
| `onDataChange`            | `(data: Record<string, any>[]) => void`  | Called when data changes (import/edit)          |
| `onColumnVisibilityChange`| `(visibility: Record<string, boolean>) => void` | Called when column visibility changes   |
| `showToolbar`             | `boolean`                                | Whether to show the toolbar                     |
| `exportFileName`          | `string`                                 | Default filename for exports                    |
| `className`               | `string`                                 | Additional CSS class for the grid container     |
| `gridOptions`             | `GridOptions`                            | Additional AG Grid options                      |
| `onRowSelected`           | `(data: Record<string, any>) => void`    | Called when a row is selected                   |
| `onAddClick`              | `() => void`                             | Called when Add button is clicked               |
| `onEditClick`             | `(data: Record<string, any>) => void`    | Called when Edit button is clicked              |
| `onDeleteClick`           | `(data: Record<string, any>[]) => void`  | Called when Delete button is clicked            |
| `onRefreshClick`          | `() => void`                             | Called when Refresh button is clicked           |
| `isLoading`               | `boolean`                                | Whether the grid is in loading state            |

## Customizing Filter Display

The filters are enabled by default with the `floatingFilter: true` property in the defaultColDef. You can override this for specific columns:

```tsx
const columnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    floatingFilter: false, // Disable filter for this column
  },
  // ...other columns
];
```

## Action Buttons Customization

The action buttons are rendered using the `ActionsCellRenderer` component. If you need to customize the appearance or behavior, you can create your own cell renderer and use it directly in your column definitions.
