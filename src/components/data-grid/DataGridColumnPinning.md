# DataGrid Column Pinning

The DataGrid component supports pinning columns to the left or right sides of the grid. Pinned columns remain fixed in position when horizontally scrolling through the grid.

## Usage

### Setting Default Pinned Columns

You can set default pinned columns by specifying the `pinned` property in the column definition:

```tsx
import { ColumnDef, DataGrid } from '@/components/data-grid/DataGrid';

const columnDefs: ColumnDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    pinned: 'left', // Pin to left side
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 150,
    // Not pinned (center)
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 100,
    pinned: 'right', // Pin to right side
  },
];

// In your component
return (
  <DataGrid
    initialData={data}
    columnDefs={columnDefs}
  />
);
```

### Runtime Column Pinning

Users can pin or unpin columns at runtime by clicking the pin icon in any column header, which displays a dropdown menu with the following options:
- Pin Left
- Pin Right
- Unpin

### Tracking Pinning Changes

You can track when users change column pinning by using the `onColumnPinningChange` callback:

```tsx
function MyComponent() {
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>({});

  return (
    <DataGrid
      initialData={data}
      columnDefs={columnDefs}
      onColumnPinningChange={(newPinning) => {
        setPinnedColumns(newPinning);
        // Save user preferences, etc.
      }}
    />
  );
}
```

### Persisting Column Pinning

Column pinning state is automatically included when using the export feature. When users import a previously exported file, the pinning state will be restored.

For client-side persistence, you can save the pinning state to localStorage:

```tsx
function MyDataGridComponent() {
  const [pinnedColumns, setPinnedColumns] = useState<Record<string, 'left' | 'right' | null>>({});

  // Save to localStorage
  const savePinningState = (pinning: Record<string, 'left' | 'right' | null>) => {
    localStorage.setItem('dataGridPinning', JSON.stringify(pinning));
  };

  // Load from localStorage on component mount
  useEffect(() => {
    const savedPinning = localStorage.getItem('dataGridPinning');
    if (savedPinning) {
      try {
        const parsed = JSON.parse(savedPinning);
        setPinnedColumns(parsed);
      } catch (err) {
        console.error('Error parsing saved pinning state', err);
      }
    }
  }, []);

  return (
    <DataGrid
      initialData={data}
      columnDefs={columnDefs}
      onColumnPinningChange={(newPinning) => {
        setPinnedColumns(newPinning);
        savePinningState(newPinning);
      }}
    />
  );
}
```

## API Reference

### ColumnDef Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pinned` | `'left' \| 'right' \| null` | `null` | Determines if the column is pinned and to which side |
| `pinIndex` | `number` | - | Controls the order of pinned columns (lower values appear first) |

### DataGrid Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onColumnPinningChange` | `(pinning: Record<string, 'left' \| 'right' \| null>) => void` | - | Callback fired when column pinning changes |

## Implementation Details

The component uses a three-section layout:
1. **Left pinned section**: Fixed to the left side with `position: sticky`
2. **Center section**: Standard scrollable content
3. **Right pinned section**: Fixed to the right side with `position: sticky`

Each section renders its own table with synchronized rows to maintain visual consistency.

## Accessibility

- Pin controls are keyboard accessible
- Proper ARIA attributes are used for menu components
- Visual indicators (color and rotation) show pin status

## Limitations

- Very large datasets with many pinned columns may impact performance
- Column width adjustments for pinned columns require manual synchronization
- Drag-and-drop reordering of pinned columns not yet implemented
