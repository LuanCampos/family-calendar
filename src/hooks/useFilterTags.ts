import { useState, useCallback } from 'react';

interface UseFilterTagsOptions {
  onFilterChange?: (selectedTagIds: string[]) => void;
}

export const useFilterTags = (options?: UseFilterTagsOptions) => {
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);

  const toggleTagFilter = useCallback((tagId: string) => {
    setSelectedFilterTags((prev) => {
      const newSelected = prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId];

      options?.onFilterChange?.(newSelected);
      return newSelected;
    });
  }, [options]);

  const clearFilters = useCallback(() => {
    setSelectedFilterTags([]);
    options?.onFilterChange?.([]);
  }, [options]);

  const isFilterActive = selectedFilterTags.length > 0;

  return {
    selectedFilterTags,
    toggleTagFilter,
    clearFilters,
    isFilterActive,
  };
};
