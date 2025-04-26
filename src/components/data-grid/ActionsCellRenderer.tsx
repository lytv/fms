import { FileEdit, Trash } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

export type ActionsCellRendererProps = {
  node: any;
  onEdit?: (data: Record<string, any>) => void;
  onDelete?: (data: Record<string, any>) => void;
};

export const ActionsCellRenderer: React.FC<ActionsCellRendererProps> = ({
  node,
  onEdit,
  onDelete,
}) => {
  const data = node.data;

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
