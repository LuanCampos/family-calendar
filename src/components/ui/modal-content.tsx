import React from 'react';
import { DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxHeight?: string; // e.g., '92vh'
}

// Reusable modal content with consistent sizing, rounding and overflow
export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
  size = 'md',
  maxHeight = '92vh',
}) => {
  const maxWidth = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-lg' : 'sm:max-w-md';
  let computedMaxHeight: string | undefined;
  if (typeof maxHeight === 'string') {
    if (maxHeight.endsWith('vh')) {
      const num = parseFloat(maxHeight.replace('vh', '')) || 92;
      computedMaxHeight = `calc(var(--app-vh, 1vh) * ${num})`;
    } else {
      computedMaxHeight = maxHeight;
    }
  }
  return (
    <DialogContent
      className={cn(
        `w-[96vw] sm:w-[90vw] ${maxWidth} overflow-hidden flex flex-col gap-0 p-0 rounded-2xl sm:rounded-xl shadow-2xl`,
        className,
      )}
      style={{ maxHeight: computedMaxHeight }}
    >
      {children}
    </DialogContent>
  );
};

export default ModalContent;
