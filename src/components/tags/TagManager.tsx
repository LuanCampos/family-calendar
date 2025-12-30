import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader2, Check, AlertCircle, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import type { EventTag, EventTagInput } from '@/types/calendar';
import { useLanguage } from '@/contexts/LanguageContext';

interface TagManagerProps {
  tags: EventTag[];
  onCreateTag: (input: EventTagInput) => Promise<{ data?: EventTag; error?: any }>;
  onUpdateTag?: (tagId: string, input: Partial<EventTagInput>) => Promise<{ data?: EventTag; error?: any }>;
  onDeleteTag?: (tagId: string) => Promise<{ error?: any }>;
  isOpen: boolean;
  onClose: () => void;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [editingTag, setEditingTag] = useState<EventTag | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNameError, setShowNameError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const isNameValid = newTagName.trim().length > 0;

  const handleCreateOrUpdateTag = async () => {
    if (!isNameValid) {
      setShowNameError(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingTag) {
        // Update existing tag
        console.log('Updating tag:', { id: editingTag.id, name: newTagName.trim(), color: newTagColor });
        const response = await onUpdateTag?.(editingTag.id, {
          name: newTagName.trim(),
          color: newTagColor,
        });

        console.log('Tag update response:', response);

        if (response && response.error) {
          console.error('Tag update error:', response.error);
          setError(t('tagError'));
        } else if (response && response.data) {
          console.log('Tag updated successfully:', response.data);
          setNewTagName('');
          setNewTagColor('#3B82F6');
          setEditingTag(null);
          setError(null);
          setShowNameError(false);
          setSuccess(t('tagUpdated'));
          setTimeout(() => setSuccess(null), 3000);
        } else {
          console.warn('Unexpected response format:', response);
          setError(t('tagError'));
        }
      } else {
        // Create new tag
        console.log('Creating tag:', { name: newTagName.trim(), color: newTagColor });
        const response = await onCreateTag({
          name: newTagName.trim(),
          color: newTagColor,
        });

        console.log('Tag creation response:', response);

        if (response && response.error) {
          console.error('Tag creation error:', response.error);
          setError(t('tagError'));
        } else if (response && response.data) {
          console.log('Tag created successfully:', response.data);
          setNewTagName('');
          setNewTagColor('#3B82F6');
          setError(null);
          setShowNameError(false);
          setSuccess(t('tagCreated'));
          setTimeout(() => setSuccess(null), 3000);
        } else {
          console.warn('Unexpected response format:', response);
          setError(t('tagError'));
        }
      }
    } catch (err) {
      console.error('Tag operation exception:', err);
      setError(t('tagError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTag = (tag: EventTag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
    setError(null);
    setSuccess(null);
    setShowNameError(false);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setError(null);
    setShowNameError(false);
  };

  // Reset validation state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowNameError(false);
    } else {
      // Limpar estado quando modal fecha
      handleCancelEdit();
    }
  }, [isOpen]);

  const handleDeleteTag = (tagId: string) => {
    setTagToDelete(tagId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (tagToDelete) {
      onDeleteTag?.(tagToDelete);
      setShowDeleteConfirm(false);
      setTagToDelete(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isNameValid && !isLoading) {
      handleCreateOrUpdateTag();
    } else if (e.key === 'Escape' && editingTag) {
      handleCancelEdit();
    }
  };

  const tagBeingDeleted = tags.find(t => t.id === tagToDelete);

  return (
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTag')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTagConfirm')} <strong>"{tagBeingDeleted?.name}"</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col gap-0 p-0 rounded-lg sm:rounded-xl">
        <DialogHeader className="border-b px-4 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3">
          <DialogTitle className="text-base sm:text-lg font-bold">
            {t('manageTags')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 p-3 sm:p-4">
          {error && (
            <div className="border border-destructive/50 rounded-lg p-2.5 sm:p-3 bg-destructive/10 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="border border-green-500/50 rounded-lg p-2.5 sm:p-3 bg-green-500/10 flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {/* Create/Edit tag */}
          <div className="space-y-2 sm:space-y-2.5 bg-muted/20 p-2.5 sm:p-3 rounded-lg">
            {editingTag && (
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs sm:text-sm font-semibold text-primary">{t('editingTag')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 text-xs"
                >
                  {t('cancel')}
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="tagName" className="text-xs sm:text-sm font-semibold">
                {t('tagName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('tagNamePlaceholder')}
                className={`text-xs sm:text-sm mt-1 ${showNameError && !isNameValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {showNameError && !isNameValid && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('tagNameRequired')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="tagColor" className="text-xs sm:text-sm font-semibold">
                {t('tagColor')}
              </Label>
              <div className="mt-2">
                <ColorPicker
                  value={newTagColor}
                  onChange={(color) => setNewTagColor(color)}
                  label={t('tagColor')}
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCreateOrUpdateTag}
              disabled={isLoading || !isNameValid}
              className="w-full text-xs sm:text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span>{editingTag ? t('updateTag') : t('createTag')}</span>
                </>
              )}
            </Button>
          </div>

          {/* Existing tags */}
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground px-1">{tags.length} {tags.length === 1 ? 'tag' : 'tags'}</p>
            {tags.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-3 sm:p-4 bg-muted/20 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  {t('noTags')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('createFirstTag')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <button
                      className="px-3 py-1.5 sm:py-2 rounded-full border transition-all text-xs sm:text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05] cursor-pointer flex-1"
                      style={{
                        borderColor: tag.color + '40',
                        backgroundColor: tag.color + '15',
                        color: 'hsl(var(--foreground))',
                      }}
                      disabled
                      title={tag.name}
                    >
                      {tag.name}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTag(tag)}
                      className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0"
                      title={t('editTag')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      title={t('deleteTag')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
