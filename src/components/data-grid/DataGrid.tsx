import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  FileEdit,
  Pin,
  Plus,
  RefreshCw,
  Trash,
  Upload,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/utils/Helpers';

// Helper components
const ActionsRenderer: React.FC<any> = ({ data, onEdit, onDelete }) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(data);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(data);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 p-0"
          onClick={handleEdit}
          title="Edit"
        >
          <FileEdit className="size-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash className="size-4" />
        </Button>
      )}
    </div>
  );
};

const CellRenderer: React.FC<{ value: any }> = ({ value }) => {
  if (value === undefined || value === null) {
    return <></>;
  }

  if (typeof value === 'boolean') {
    return <>{value ? 'Yes' : 'No'}</>;
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return <></>;
    }
    return <>{value.toLocaleString()}</>;
  }

  if (value instanceof Date) {
    return <>{value.toLocaleDateString()}</>;
  }

  return <>{value.toString()}</>;
};

// Add resize handle component
const ResizeHandle: React.FC<{ onResize: (deltaX: number) => void }> = ({ onResize }) => {
  const startPosRef = useRef<number | null>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (startPosRef.current !== null) {
      const deltaX = e.clientX - startPosRef.current;
      onResize(deltaX);
      startPosRef.current = e.clientX;
    }
  };

  const handleMouseUp = () => {
    startPosRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startPosRef.current = e.clientX;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  return (
    <button
      type="button"
      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20 focus:outline-none focus:ring-1 focus:ring-primary"
      onMouseDown={handleMouseDown}
      aria-label="Resize column"
    />
  );
};

export type ColumnDef = {
  field: string;
  headerName?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  editable?: boolean;
  sortable?: boolean;
  filter?: boolean;
  resizable?: boolean;
  floatingFilter?: boolean;
  cellRenderer?: React.FC<any>;
  cellRendererParams?: Record<string, any>;
  valueFormatter?: (params: { value: any }) => string;
  hide?: boolean;
  pinned?: 'left' | 'right' | null;
  pinIndex?: number;
};

export type DataGridProps = {
  initialData: Record<string, any>[];
  columnDefs?: ColumnDef[];
  defaultColDef?: Partial<ColumnDef>;
  onDataChange?: (data: Record<string, any>[]) => void;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  onColumnPinningChange?: (pinning: Record<string, 'left' | 'right' | null>) => void;
  showToolbar?: boolean;
  exportFileName?: string;
  className?: string;
  gridOptions?: any;
  onRowSelected?: (data: Record<string, any>) => void;
  onAddClick?: () => void;
  onEditClick?: (data: Record<string, any>) => void;
  onDeleteClick?: (data: Record<string, any>[]) => void;
  onRefreshClick?: () => void;
  isLoading?: boolean;
};

// Define default column definition
const DEFAULT_COL_DEF: Partial<ColumnDef> = {
  flex: 1,
  minWidth: 100,
  editable: false,
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true,
  pinned: null,
};

export const DataGrid: React.FC<DataGridProps> = ({
  initialData,
  columnDefs: inputColumnDefs,
  defaultColDef: _defaultColDef = DEFAULT_COL_DEF,
  onDataChange,
  onColumnVisibilityChange,
  onColumnPinningChange,
  showToolbar = true,
  exportFileName = 'data-export.xlsx',
  className,
  onRowSelected,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRefreshClick,
  isLoading = false,
}) => {
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
  const [rowData, setRowData] = useState<Record<string, any>[]>(initialData);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnPinning, setColumnPinning] = useState<Record<string, 'left' | 'right' | null>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'ascending' | 'descending' | null }>({
    key: null,
    direction: null,
  });
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const rowsPerPage = 10;
  const emptyArray: ColumnDef[] = [];

  // Add action column to columnDefs if onEditClick or onDeleteClick are provided
  const columnDefs = useMemo(() => {
    if (!inputColumnDefs || inputColumnDefs.length === 0) {
      return emptyArray;
    }

    // Apply default column properties to each column
    const columnsWithDefaults = inputColumnDefs.map(col => ({
      ..._defaultColDef,
      ...col,
    }));

    if (onEditClick || onDeleteClick) {
      // Check if actions column already exists
      const hasActionsColumn = columnsWithDefaults.some(col => col.field === 'actions');

      if (!hasActionsColumn) {
        return [
          ...columnsWithDefaults,
          {
            headerName: 'Actions',
            field: 'actions',
            filter: false,
            sortable: false,
            editable: false,
            floatingFilter: false,
            cellRenderer: ActionsRenderer,
            cellRendererParams: {
              onEdit: onEditClick,
              onDelete: (data: Record<string, any>) => {
                if (onDeleteClick) {
                  onDeleteClick([data]);
                }
              },
            },
            minWidth: 120,
            maxWidth: 120,
          },
        ];
      }
    }

    return columnsWithDefaults;
  }, [inputColumnDefs, onEditClick, onDeleteClick, _defaultColDef]);

  // Initialize column visibility, widths, and pinning
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    const initialWidths: Record<string, number> = {};
    const initialPinning: Record<string, 'left' | 'right' | null> = {};

    columnDefs.forEach((col) => {
      initialVisibility[col.field] = col.hide !== true;
      initialWidths[col.field] = col.width || col.minWidth || 150;
      initialPinning[col.field] = col.pinned || null;
    });

    setColumnVisibility(initialVisibility);
    setColumnWidths(initialWidths);
    setColumnPinning(initialPinning);
  }, [columnDefs]);

  useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    return rowData.filter((row) => {
      return Object.entries(filterValues).every(([field, filterValue]) => {
        if (!filterValue) {
          return true;
        }

        const value = row[field];
        if (value === undefined || value === null) {
          return false;
        }

        return String(value).toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [rowData, filterValues]);

  // Apply sorting to filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle undefined and null values
      if (aValue === undefined || aValue === null) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (bValue === undefined || bValue === null) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // Check if strings are dates (like "4/25/2025, 9:25:35 PM")
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);

        // If both strings are valid dates
        if (!Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime())) {
          return sortConfig.direction === 'ascending'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        // Regular string comparison
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        // Date comparison
        return sortConfig.direction === 'ascending'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Number comparison
        return sortConfig.direction === 'ascending'
          ? aValue - bValue
          : bValue - aValue;
      } else {
        // Convert to string for other types
        const aString = String(aValue);
        const bString = String(bValue);
        return sortConfig.direction === 'ascending'
          ? aString.localeCompare(bString)
          : bString.localeCompare(aString);
      }
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleExportExcel = useCallback(() => {
    // Prepare export data from all visible rows after filtering
    const exportData = filteredData.map((row) => {
      const rowData: Record<string, any> = {};
      columnDefs.forEach((col) => {
        if (columnVisibility[col.field]) {
          rowData[col.field] = row[col.field];
        }
      });
      return rowData;
    });

    // Create metadata sheet with column configuration
    const metadataSheet = [
      {
        key: 'columnPinning',
        value: JSON.stringify(columnPinning),
      },
      {
        key: 'columnVisibility',
        value: JSON.stringify(columnVisibility),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const metadataWorksheet = XLSX.utils.json_to_sheet(metadataSheet);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Metadata');

    XLSX.writeFile(workbook, exportFileName);
  }, [columnDefs, columnVisibility, columnPinning, exportFileName, filteredData]);

  const handleImportExcel = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Get the main data sheet
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            console.error('No sheet found in Excel file');
            return;
          }
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            console.error('Worksheet not found in Excel file');
            return;
          }
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Try to get metadata sheet if exists
          const metadataSheetName = workbook.SheetNames.find(name => name === 'Metadata');
          if (metadataSheetName) {
            const metadataWorksheet = workbook.Sheets[metadataSheetName];
            if (metadataWorksheet) {
              const metadataJson = XLSX.utils.sheet_to_json(metadataWorksheet) as Array<{ key: string; value: string }>;

              // Process column pinning state
              const pinningSetting = metadataJson.find(item => item.key === 'columnPinning');
              if (pinningSetting && pinningSetting.value) {
                try {
                  const parsedPinning = JSON.parse(pinningSetting.value) as Record<string, 'left' | 'right' | null>;
                  setColumnPinning(parsedPinning);
                  if (onColumnPinningChange) {
                    onColumnPinningChange(parsedPinning);
                  }
                } catch (err) {
                  console.error('Error parsing column pinning settings:', err);
                }
              }

              // Process column visibility state
              const visibilitySetting = metadataJson.find(item => item.key === 'columnVisibility');
              if (visibilitySetting && visibilitySetting.value) {
                try {
                  const parsedVisibility = JSON.parse(visibilitySetting.value) as Record<string, boolean>;
                  setColumnVisibility(parsedVisibility);
                  if (onColumnVisibilityChange) {
                    onColumnVisibilityChange(parsedVisibility);
                  }
                } catch (err) {
                  console.error('Error parsing column visibility settings:', err);
                }
              }
            }
          }

          if (jsonData && jsonData.length > 0) {
            setRowData(jsonData as Record<string, any>[]);
            if (onDataChange) {
              onDataChange(jsonData as Record<string, any>[]);
            }
          }
        } catch (error) {
          console.error('Error importing Excel file:', error);
        }
      };
      reader.readAsArrayBuffer(file);

      // Reset the input value so the same file can be imported again
      event.target.value = '';
    },
    [onDataChange, onColumnVisibilityChange, onColumnPinningChange],
  );

  const toggleColumnVisibility = useCallback((colId: string) => {
    setColumnVisibility((prev) => {
      const newVisibility = {
        ...prev,
        [colId]: !prev[colId],
      };

      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(newVisibility);
      }

      return newVisibility;
    });
  }, [onColumnVisibilityChange]);

  const handleRowSelection = useCallback((row: Record<string, any>, isSelected: boolean) => {
    setSelectedRows((prev) => {
      if (isSelected) {
        // Add row to selection if not already present
        if (!prev.some(item => item.id === row.id)) {
          const newSelection = [...prev, row];
          if (newSelection.length === 1 && onRowSelected) {
            const selectedRow = newSelection[0]!;
            onRowSelected(selectedRow);
          }
          return newSelection;
        }
      } else {
        // Remove row from selection
        return prev.filter(item => item.id !== row.id);
      }
      return prev;
    });
  }, [onRowSelected]);

  const isRowSelected = useCallback((row: Record<string, any>) => {
    return selectedRows.some(item => item.id === row.id);
  }, [selectedRows]);

  // Sorting logic
  const requestSort = useCallback((key: string) => {
    setSortConfig((prevSortConfig) => {
      if (prevSortConfig.key === key) {
        if (prevSortConfig.direction === 'ascending') {
          return { key, direction: 'descending' };
        } else if (prevSortConfig.direction === 'descending') {
          return { key: null, direction: null };
        } else {
          return { key, direction: 'ascending' };
        }
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Column resize handler
  const handleColumnResize = useCallback((field: string, deltaX: number) => {
    setColumnWidths((prev) => {
      const currentWidth = prev[field] || 150;
      const newWidth = Math.max(100, currentWidth + deltaX); // Enforce minimum width
      return {
        ...prev,
        [field]: newWidth,
      };
    });
  }, []);

  // Row click handler for selection
  const handleRowClick = useCallback((row: Record<string, any>) => {
    const isSelected = isRowSelected(row);
    handleRowSelection(row, !isSelected);
  }, [handleRowSelection, isRowSelected]);

  // Column pinning functions
  const pinColumn = useCallback((field: string, position: 'left' | 'right' | null) => {
    setColumnPinning((prev) => {
      const newPinning = {
        ...prev,
        [field]: position,
      };

      if (onColumnPinningChange) {
        onColumnPinningChange(newPinning);
      }

      return newPinning;
    });
  }, [onColumnPinningChange]);

  // Group columns by pinning status
  const groupedColumns = useMemo(() => {
    const leftPinned: ColumnDef[] = [];
    const center: ColumnDef[] = [];
    const rightPinned: ColumnDef[] = [];

    columnDefs.forEach((col) => {
      const pinnedStatus = columnPinning[col.field];
      if (pinnedStatus === 'left') {
        leftPinned.push(col);
      } else if (pinnedStatus === 'right') {
        rightPinned.push(col);
      } else {
        center.push(col);
      }
    });

    return { leftPinned, center, rightPinned };
  }, [columnDefs, columnPinning]);

  // Extract cell rendering code into a separate function for reuse
  const renderCells = useCallback((row: Record<string, any>, rowIndex: number, columns: ColumnDef[]) => {
    return columns.map(column => (
      columnVisibility[column.field] && (
        <TableCell
          key={`${rowIndex}-${column.field}`}
          style={{
            width: `${columnWidths[column.field]}px`,
          }}
        >
          {column.cellRenderer
            ? (
                <column.cellRenderer
                  data={row}
                  value={row[column.field]}
                  {...column.cellRendererParams}
                />
              )
            : column.valueFormatter
              ? (
                  column.valueFormatter({ value: row[column.field] })
                )
              : (
                  <CellRenderer value={row[column.field]} />
                )}
        </TableCell>
      )
    ));
  }, [columnVisibility, columnWidths]);

  // Extract header rendering code into a separate function for reuse
  const renderHeaders = useCallback((columns: ColumnDef[]) => {
    return columns.map(column => (
      columnVisibility[column.field] && (
        <TableHead
          key={column.field}
          className="relative"
          style={{
            width: `${columnWidths[column.field]}px`,
            minWidth: `${column.minWidth || 100}px`,
            maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
          }}
        >
          <div className="flex flex-col space-y-1">
            <div
              className={cn('flex items-center justify-between', {
                'cursor-pointer select-none': column.sortable,
              })}
            >
              <div
                className="flex items-center"
                onClick={() => {
                  if (column.sortable) {
                    requestSort(column.field);
                  }
                }}
                onKeyDown={(e) => {
                  if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    requestSort(column.field);
                  }
                }}
                role={column.sortable ? 'button' : undefined}
                tabIndex={column.sortable ? 0 : undefined}
              >
                {column.headerName || column.field}
                {column.sortable && (
                  <div className="ml-1">
                    {sortConfig.key === column.field
                      ? (
                          sortConfig.direction === 'ascending'
                            ? (
                                <ChevronUp className="size-3" />
                              )
                            : (
                                <ChevronDown className="size-3" />
                              )
                        )
                      : null}
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 size-5 p-0"
                  >
                    <Pin className={cn(
                      'size-3',
                      columnPinning[column.field] === 'left' && 'text-blue-500 rotate-45',
                      columnPinning[column.field] === 'right' && 'text-green-500 -rotate-45',
                    )}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem
                    onClick={() => pinColumn(column.field, 'left')}
                    className={cn(
                      'flex items-center gap-2',
                      columnPinning[column.field] === 'left' && 'bg-blue-50 text-blue-600',
                    )}
                  >
                    <Pin className="size-4 rotate-45" />
                    Pin Left
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => pinColumn(column.field, 'right')}
                    className={cn(
                      'flex items-center gap-2',
                      columnPinning[column.field] === 'right' && 'bg-green-50 text-green-600',
                    )}
                  >
                    <Pin className="size-4 -rotate-45" />
                    Pin Right
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => pinColumn(column.field, null)}
                    disabled={columnPinning[column.field] === null}
                    className="flex items-center gap-2"
                  >
                    <Pin className="size-4 opacity-50" />
                    Unpin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {column.filter && (
              <Input
                placeholder={`Filter ${column.headerName || column.field}`}
                value={filterValues[column.field] || ''}
                onChange={e => handleFilterChange(column.field, e.target.value)}
                className="h-7 text-xs"
              />
            )}
          </div>
          {column.resizable !== false && (
            <ResizeHandle
              onResize={deltaX => handleColumnResize(column.field, deltaX)}
            />
          )}
        </TableHead>
      )
    ));
  }, [columnVisibility, columnWidths, columnPinning, sortConfig, filterValues, pinColumn, requestSort, handleFilterChange, handleColumnResize]);

  return (
    <div className={cn('flex flex-col', className)}>
      {showToolbar && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {onAddClick && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onAddClick}
              >
                <Plus className="size-4" />
                Add
              </Button>
            )}
            {onEditClick && selectedRows.length === 1 && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  if (selectedRows[0]) {
                    onEditClick(selectedRows[0]);
                  }
                }}
              >
                <FileEdit className="size-4" />
                Edit
              </Button>
            )}
            {onDeleteClick && selectedRows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => onDeleteClick(selectedRows)}
              >
                <Trash className="size-4" />
                Delete
              </Button>
            )}
            {onRefreshClick && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={onRefreshClick}
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Eye className="size-4" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                {columnDefs.filter(col => col.headerName).map(column => (
                  <DropdownMenuItem
                    key={column.field}
                    onClick={() => toggleColumnVisibility(column.field)}
                    className="flex items-center gap-2"
                  >
                    {columnVisibility[column.field]
                      ? <Eye className="size-4" />
                      : <EyeOff className="size-4" />}
                    {column.headerName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleExportExcel}
            >
              <Download className="size-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx, .xls, .csv';
                input.onchange = (e: Event) => {
                  const inputElement = e.target as HTMLInputElement;
                  if (inputElement?.files?.length) {
                    const changeEvent = {
                      target: inputElement,
                    } as React.ChangeEvent<HTMLInputElement>;
                    handleImportExcel(changeEvent);
                  }
                };
                input.click();
              }}
            >
              <Upload className="size-4" />
              Import
            </Button>
          </div>
        </div>
      )}
      <div
        className={cn(
          'h-[500px] w-full rounded-md border shadow-sm',
          {
            'opacity-50': isLoading,
          },
        )}
      >
        <div className="relative flex w-full overflow-auto">
          {/* Left Pinned Columns */}
          {groupedColumns.leftPinned.length > 0 && (
            <div className="sticky left-0 z-20 bg-background shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
              <Table className="w-auto table-fixed border-collapse">
                <TableHeader className="sticky top-0 z-30 bg-background">
                  <TableRow>
                    {groupedColumns.leftPinned.length > 0 && (
                      <TableHead className="w-[50px] p-2">
                        <Checkbox
                          checked={selectedRows.length > 0 && selectedRows.length === paginatedData.length}
                          onCheckedChange={(checked: boolean | 'indeterminate') => {
                            if (checked === true) {
                              setSelectedRows(paginatedData);
                              if (paginatedData.length === 1 && onRowSelected && paginatedData[0]) {
                                const selectedRow = paginatedData[0]!;
                                onRowSelected(selectedRow);
                              }
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    {renderHeaders(groupedColumns.leftPinned)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0
                    ? (
                        paginatedData.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            className={cn(
                              rowIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background',
                              'hover:bg-muted/30 cursor-pointer',
                              {
                                'bg-primary/10 hover:bg-primary/15 border-l-4 border-primary': isRowSelected(row),
                              },
                            )}
                            onClick={() => handleRowClick(row)}
                          >
                            <TableCell className="p-2">
                              <Checkbox
                                checked={isRowSelected(row)}
                                onCheckedChange={(checked: boolean | 'indeterminate') => {
                                  handleRowSelection(row, checked === true);
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                            </TableCell>
                            {renderCells(row, rowIndex, groupedColumns.leftPinned)}
                          </TableRow>
                        ))
                      )
                    : (
                        <TableRow>
                          <TableCell colSpan={groupedColumns.leftPinned.length + 1} className="h-24 text-center">
                            {/* Empty state handled in main section */}
                          </TableCell>
                        </TableRow>
                      )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Center (Scrollable) Columns */}
          <div className="grow">
            <Table className="w-full table-fixed border-collapse">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  {groupedColumns.leftPinned.length === 0 && (
                    <TableHead className="w-[50px] p-2">
                      <Checkbox
                        checked={selectedRows.length > 0 && selectedRows.length === paginatedData.length}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          if (checked === true) {
                            setSelectedRows(paginatedData);
                            if (paginatedData.length === 1 && onRowSelected && paginatedData[0]) {
                              const selectedRow = paginatedData[0]!;
                              onRowSelected(selectedRow);
                            }
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  {renderHeaders(groupedColumns.center)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0
                  ? (
                      paginatedData.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className={cn(
                            rowIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background',
                            'hover:bg-muted/30 cursor-pointer',
                            {
                              'bg-primary/10 hover:bg-primary/15 border-l-4 border-primary': isRowSelected(row),
                            },
                          )}
                          onClick={() => handleRowClick(row)}
                        >
                          {groupedColumns.leftPinned.length === 0 && (
                            <TableCell className="p-2">
                              <Checkbox
                                checked={isRowSelected(row)}
                                onCheckedChange={(checked: boolean | 'indeterminate') => {
                                  handleRowSelection(row, checked === true);
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                            </TableCell>
                          )}
                          {renderCells(row, rowIndex, groupedColumns.center)}
                        </TableRow>
                      ))
                    )
                  : (
                      <TableRow>
                        <TableCell
                          colSpan={
                            (groupedColumns.leftPinned.length === 0 ? 1 : 0)
                            + groupedColumns.center.filter(col => columnVisibility[col.field]).length
                          }
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </div>

          {/* Right Pinned Columns */}
          {groupedColumns.rightPinned.length > 0 && (
            <div className="sticky right-0 z-20 bg-background shadow-[-2px_0_5px_rgba(0,0,0,0.1)]">
              <Table className="w-auto table-fixed border-collapse">
                <TableHeader className="sticky top-0 z-30 bg-background">
                  <TableRow>
                    {renderHeaders(groupedColumns.rightPinned)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length > 0
                    ? (
                        paginatedData.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            className={cn(
                              rowIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background',
                              'hover:bg-muted/30 cursor-pointer',
                              {
                                'bg-primary/10 hover:bg-primary/15': isRowSelected(row),
                              },
                            )}
                            onClick={() => handleRowClick(row)}
                          >
                            {renderCells(row, rowIndex, groupedColumns.rightPinned)}
                          </TableRow>
                        ))
                      )
                    : (
                        <TableRow>
                          <TableCell colSpan={groupedColumns.rightPinned.length} className="h-24 text-center">
                            {/* Empty state handled in main section */}
                          </TableCell>
                        </TableRow>
                      )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing
            {' '}
            {(currentPage - 1) * rowsPerPage + 1}
            {' '}
            to
            {' '}
            {Math.min(currentPage * rowsPerPage, sortedData.length)}
            {' '}
            of
            {' '}
            {sortedData.length}
            {' '}
            entries
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
