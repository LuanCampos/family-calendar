import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { EventTag } from '@/types/calendar';

interface FilterTagsProps {
  tags: EventTag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterTags: React.FC<FilterTagsProps> = ({
  tags,
  selectedTagIds,
  onTagToggle,
  onClearFilters,
  isOpen,
  onToggle,
}) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Filter toggle button */}
      <Button
        variant={selectedTagIds.length > 0 ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
        className="text-xs sm:text-sm"
        title="Toggle tag filters"
      >
        Filtrar ({selectedTagIds.length})
      </Button>

      {/* Filter tags display when open */}
      {isOpen && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 sm:p-3 bg-muted/30 rounded-lg">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border transition-all text-xs sm:text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05]"
                style={{
                  borderColor: isSelected ? tag.color : tag.color + '40',
                  backgroundColor: isSelected ? tag.color : tag.color + '15',
                  color: isSelected ? tag.color : 'hsl(var(--foreground))',
                }}
                title={tag.name}
              >
                {isSelected && <span className="mr-1">✓</span>}
                {tag.name}
              </button>
            );
          })}

          {/* Clear filters button */}
          {selectedTagIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50"
              title="Clear all filters"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
