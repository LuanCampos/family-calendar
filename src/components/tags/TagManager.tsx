import React, { useState } from 'react';
import { Trash2, Plus, Loader2, Check, AlertCircle, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const handleDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (window.confirm(`Deletar tag "${tag?.name}"? Esta ação não pode ser desfeita.`)) {
      onDeleteTag?.(tagId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isNameValid && !isLoading) {
      handleCreateOrUpdateTag();
    } else if (e.key === 'Escape' && editingTag) {
      handleCancelEdit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">
            {t('manageTags')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          {error && (
            <div className="border border-destructive/50 rounded-lg p-3 bg-destructive/10 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="border border-green-500/50 rounded-lg p-3 bg-green-500/10 flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          {/* Create/Edit tag */}
          <div className="space-y-3">
            {editingTag && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary">{t('editingTag')}</p>
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
              <Label htmlFor="tagName" className="text-sm font-medium">
                {t('tagName')} *
              </Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  if (e.target.value.trim().length > 0) setShowNameError(false);
                }}
                onBlur={() => {
                  if (newTagName.trim().length === 0) setShowNameError(true);
                }}
                onKeyPress={handleKeyPress}
                placeholder={t('tagNamePlaceholder')}
                className={`mt-1 ${showNameError && !isNameValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {showNameError && !isNameValid && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('tagNameRequired')}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="tagColor" className="text-sm font-medium">
                {t('tagColor')}
              </Label>
              <div className="flex gap-2 mt-1">
                <div className="w-12 h-10 rounded border border-border bg-card p-1 flex items-center justify-center shadow-sm">
                  <input
                    id="tagColor"
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-full h-full rounded cursor-pointer border-0"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <Input
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1 font-mono text-sm"
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
                  {t('saving')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingTag ? t('updateTag') : t('createTag')}
                </>
              )}
            </Button>
          </div>

          {/* Existing tags */}
          <div className="space-y-2">
            {tags.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-6 bg-muted/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('noTags')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('createFirstTag')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
                  >
                    <div
                      className="w-5 h-5 rounded-md flex-shrink-0 border-2 border-border/50 shadow-sm"
                      style={{ backgroundColor: tag.color }}
                      title={tag.color}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {tag.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTag(tag)}
                      className="h-8 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('editTag')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('deleteTag')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
