import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Loader2, Check, AlertCircle, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModalContent } from '@/components/ui/modal-content';
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
import { logger } from '@/lib/logger';

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
        logger.debug('tagManager.update.start', { id: editingTag.id, name: newTagName.trim(), color: newTagColor });
        const response = await onUpdateTag?.(editingTag.id, {
          name: newTagName.trim(),
          color: newTagColor,
        });
        logger.debug('tagManager.update.result', { response });

        if (response && response.error) {
          logger.error('tagManager.update.error', { error: response.error });
          setError(t('tagError'));
        } else if (response && response.data) {
          logger.info('tagManager.update.success', { tagId: response.data.id });
          setNewTagName('');
          setNewTagColor('#3B82F6');
          setEditingTag(null);
          setError(null);
          setShowNameError(false);
          setSuccess(t('tagUpdated'));
          setTimeout(() => setSuccess(null), 3000);
        } else {
          logger.warn('tagManager.update.unexpectedResponse', { response });
          setError(t('tagError'));
        }
      } else {
        // Create new tag
        logger.debug('tagManager.create.start', { name: newTagName.trim(), color: newTagColor });
        const response = await onCreateTag({
          name: newTagName.trim(),
          color: newTagColor,
        });
        logger.debug('tagManager.create.result', { response });

        if (response && response.error) {
          logger.error('tagManager.create.error', { error: response.error });
          setError(t('tagError'));
        } else if (response && response.data) {
          logger.info('tagManager.create.success', { tagId: response.data.id });
          setNewTagName('');
          setNewTagColor('#3B82F6');
          setError(null);
          setShowNameError(false);
          setSuccess(t('tagCreated'));
          setTimeout(() => setSuccess(null), 3000);
        } else {
          logger.warn('tagManager.create.unexpectedResponse', { response });
          setError(t('tagError'));
        }
      }
    } catch (err) {
      logger.error('tagManager.operation.exception', { error: err });
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
        <ModalContent size="md">
        <DialogHeader className="border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 sm:pt-4 pb-3 sm:pb-3">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {t('manageTags')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-3 p-4 sm:p-5">
          {error && (
            <div className="border-2 border-destructive/50 rounded-xl p-3 sm:p-3.5 bg-destructive/10 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="border-2 border-green-500/50 rounded-xl p-3 sm:p-3.5 bg-green-500/10 flex items-start gap-2.5">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {/* Create/Edit tag */}
          <div className="space-y-3 sm:space-y-3 bg-muted/30 p-4 sm:p-4 rounded-xl border-2 border-border">
            {editingTag && (
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-primary">Editando tag</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  {t('cancel')}
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="tagName" className="text-sm font-medium">
                {t('tagName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('tagNamePlaceholder')}
                className={`text-sm mt-2 h-9 ${showNameError && !isNameValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {showNameError && !isNameValid && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  {t('tagNameRequired')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="tagColor" className="text-sm font-medium">
                {t('tagColor')}
              </Label>
              <div className="mt-2.5">
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
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  <span>{editingTag ? t('updateTag') : t('createTag')}</span>
                </>
              )}
            </Button>
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">{tags.length} {tags.length === 1 ? 'tag' : 'tags'}</p>
            {tags.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-xl p-5 sm:p-6 bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground mb-1.5">
                  {t('noTags')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('createFirstTag')}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <button
                      className="px-3 py-2 rounded-full border-2 transition-all text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.03] cursor-default flex-1"
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
                      className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10 flex-shrink-0"
                      title={t('editTag')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
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
        </ModalContent>
    </Dialog>
    </>
  );
};
