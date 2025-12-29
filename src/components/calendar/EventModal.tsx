import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, AlertCircle, Check } from 'lucide-react';
import { getTagIds } from '@/lib/utils/eventUtils';
import type { Event, EventInput, EventTag } from '@/types/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: EventInput) => void;
  onDelete?: (eventId: string) => void;
  selectedDate: string;
  editingEvent?: Event;
  availableTags: EventTag[];
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  editingEvent,
  availableTags,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [time, setTime] = useState(editingEvent?.time || '');
  const [duration, setDuration] = useState(editingEvent?.duration?.toString() || '60');
  const [isAllDay, setIsAllDay] = useState(editingEvent?.isAllDay || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    editingEvent ? getTagIds(editingEvent.tags) : []
  );
  const [showValidation, setShowValidation] = useState(false);

  const isValid = title.trim().length > 0;

  const handleSave = () => {
    if (!isValid) {
      setShowValidation(true);
      return;
    }

    const input: EventInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: selectedDate,
      isAllDay,
      time: isAllDay ? undefined : (time || undefined),
      duration: isAllDay ? undefined : (duration ? parseInt(duration) : undefined),
      tags: selectedTags,
    };

    onSave(input);
    handleClose();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      if (window.confirm(t('deleteEventConfirm'))) {
        onDelete(editingEvent.id);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setTime('');
    setDuration('60');
    setIsAllDay(false);
    setSelectedTags([]);
    setShowValidation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg">
            {editingEvent ? t('editEvent') : t('newEvent')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {(() => {
              const date = new Date(selectedDate);
              const dayOfWeek = t(`day-${date.getDay()}` as any);
              const month = t(`month-${date.getMonth()}` as any);
              return `${dayOfWeek}, ${date.getDate()} de ${month} de ${date.getFullYear()}`;
            })()}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('eventTitle')} *
              </Label>
              {isValid && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim().length > 0) setShowValidation(false);
              }}
              onBlur={() => {
                if (title.trim().length === 0) setShowValidation(true);
              }}
              placeholder={t('eventTitlePlaceholder')}
              autoFocus
              className={`mt-1 ${showValidation && !isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {showValidation && !isValid && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('eventTitleRequired')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              {t('eventDescription')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('eventDescriptionPlaceholder')}
              className="min-h-24 mt-1 resize-none"
            />
          </div>

          {/* All-day checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isAllDay"
              checked={isAllDay}
              onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
            />
            <Label
              htmlFor="isAllDay"
              className="text-sm font-medium cursor-pointer"
            >
              {t('eventAllDay')}
            </Label>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time" className="text-sm font-medium">
                  {t('eventTime')}
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm font-medium">
                  {t('eventDuration')}
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {availableTags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">{t('tags')}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    className="px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium text-center hover:shadow-sm"
                    style={{
                      borderColor: selectedTags.includes(tag.id) ? tag.color : 'hsl(var(--border))',
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color + '25' : 'transparent',
                      color: selectedTags.includes(tag.id) ? tag.color : 'hsl(var(--foreground))',
                    }}
                  >
                    {selectedTags.includes(tag.id) && <span className="mr-1">✓</span>}
                    {tag.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTags.length} {selectedTags.length === 1 ? 'tag selecionada' : 'tags selecionadas'}
              </p>
            </div>
          )}
          {availableTags.length === 0 && (
            <div className="border border-dashed border-border rounded-lg p-4 bg-muted/20">
              <p className="text-sm text-muted-foreground text-center mb-2">
                {t('noTags')}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {t('createFirstTag')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between pt-4 border-t">
          {editingEvent && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('delete')}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isValid && showValidation}
            >
              {editingEvent ? t('update') : t('create')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
