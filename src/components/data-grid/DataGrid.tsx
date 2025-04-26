import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import type { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import {
  Download,
  Eye,
  EyeOff,
  FileEdit,
  Plus,
  RefreshCw,
  Trash,
  Upload,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import { ActionsCellRenderer } from '@/components/data-grid/ActionsCellRenderer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/Helpers';

// Register the ClientSideRowModelModule
ModuleRegistry.registerModules([ClientSideRowModelModule]);

export type DataGridProps = {
  initialData: Record<string, any>[];
  columnDefs?: ColDef[];
  defaultColDef?: ColDef;
  onDataChange?: (data: Record<string, any>[]) => void;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  showToolbar?: boolean;
  exportFileName?: string;
  className?: string;
  gridOptions?: GridOptions;
  onRowSelected?: (data: Record<string, any>) => void;
  onAddClick?: () => void;
  onEditClick?: (data: Record<string, any>) => void;
  onDeleteClick?: (data: Record<string, any>[]) => void;
  onRefreshClick?: () => void;
  isLoading?: boolean;
};

// Define default column definition outside component to avoid re-creation
const DEFAULT_COL_DEF = {
  flex: 1,
  minWidth: 100,
  editable: false,
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: true, // Enable floating filters for all columns
};

export const DataGrid: React.FC<DataGridProps> = ({
  initialData,
  columnDefs: inputColumnDefs,
  defaultColDef = DEFAULT_COL_DEF,
  onDataChange,
  onColumnVisibilityChange,
  showToolbar = true,
  exportFileName = 'data-export.xlsx',
  className,
  gridOptions,
  onRowSelected,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onRefreshClick,
  isLoading = false,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);
  const [rowData, setRowData] = useState<Record<string, any>[]>(initialData);

  // Add action column to columnDefs if onEditClick or onDeleteClick are provided
  const columnDefs = useMemo(() => {
    if (!inputColumnDefs) {
      return [];
    }

    if (onEditClick || onDeleteClick) {
      // Check if actions column already exists
      const hasActionsColumn = inputColumnDefs.some(col => col.field === 'actions');

      if (!hasActionsColumn) {
        return [
          ...inputColumnDefs,
          {
            headerName: 'Actions',
            field: 'actions',
            filter: false,
            sortable: false,
            editable: false,
            floatingFilter: false,
            cellRenderer: ActionsCellRenderer,
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

    return inputColumnDefs;
  }, [inputColumnDefs, onEditClick, onDeleteClick]);

  useEffect(() => {
    setRowData(initialData);
  }, [initialData]);

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const handleSelectionChanged = useCallback(() => {
    if (gridApi) {
      const selectedRows = gridApi.getSelectedRows();
      setSelectedRows(selectedRows);
      if (selectedRows.length === 1 && onRowSelected) {
        onRowSelected(selectedRows[0]);
      }
    }
  }, [gridApi, onRowSelected]);

  const handleExportExcel = useCallback(() => {
    if (!gridApi) {
      return;
    }

    // Prepare export data from selected rows or all visible rows
    const exportData: Record<string, any>[] = [];
    gridApi.forEachNodeAfterFilterAndSort((node: any) => {
      if (node.data) {
        exportData.push(node.data);
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, exportFileName);
  }, [gridApi, exportFileName]);

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
    [onDataChange],
  );

  const handleColumnsVisibilityChange = useCallback(() => {
    if (!gridApi) {
      return;
    }

    const columns = gridApi.getColumns();
    if (!columns) {
      return;
    }

    const visibility: Record<string, boolean> = {};
    columns.forEach((column) => {
      visibility[column.getColId()] = column.isVisible();
    });

    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(visibility);
    }
  }, [gridApi, onColumnVisibilityChange]);

  const toggleColumnVisibility = useCallback(
    (colId: string) => {
      if (!gridApi) {
        return;
      }

      const column = gridApi.getColumn(colId);
      if (column) {
        const isVisible = column.isVisible();
        gridApi.setColumnsVisible([colId], !isVisible);
        handleColumnsVisibilityChange();
      }
    },
    [gridApi, handleColumnsVisibilityChange],
  );

  const gridOptionsWithDefaults = useMemo<GridOptions>(
    () => ({
      rowSelection: 'multiple',
      animateRows: true,
      pagination: true,
      paginationPageSize: 10,
      theme: 'legacy', // Use legacy theme to maintain compatibility with existing CSS
      modules: [ClientSideRowModelModule],
      ...gridOptions,
      onSelectionChanged: handleSelectionChanged,
    }),
    [gridOptions, handleSelectionChanged],
  );

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
                {gridApi
                && gridApi.getColumns()
                  ?.filter(col => col.getColDef().headerName)
                  .map(column => (
                    <DropdownMenuItem
                      key={column.getColId()}
                      onClick={() => toggleColumnVisibility(column.getColId())}
                      className="flex items-center gap-2"
                    >
                      {column.isVisible()
                        ? <Eye className="size-4" />
                        : <EyeOff className="size-4" />}
                      {column.getColDef().headerName}
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
          'ag-theme-alpine h-[500px] w-full rounded-md border shadow-sm',
          {
            'opacity-50': isLoading,
          },
        )}
      >
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={handleGridReady}
          {...gridOptionsWithDefaults}
        />
      </div>
    </div>
  );
};

export const AutoDetectRenderer = (params: any) => {
  if (params.value === undefined || params.value === null) {
    return '';
  }

  if (typeof params.value === 'boolean') {
    return params.value ? 'Yes' : 'No';
  }

  if (typeof params.value === 'number') {
    if (Number.isNaN(params.value)) {
      return '';
    }
    return params.value.toLocaleString();
  }

  if (params.value instanceof Date) {
    return params.value.toLocaleDateString();
  }

  return params.value.toString();
};
