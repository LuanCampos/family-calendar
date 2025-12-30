import React, { useState, useEffect } from 'react';
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
import { TimePicker } from '@/components/ui/time-picker';
import { Trash2, AlertCircle, Check, Clock, Timer, Sun } from 'lucide-react';
import { getTagIds } from '@/lib/utils/eventUtils';
import type { Event, EventInput, EventTag, RecurrenceRule } from '@/types/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { RecurrenceConfig, RecurrencePreview } from '@/components/recurring';

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
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    editingEvent?.recurrenceRule || null
  );
  const [showValidation, setShowValidation] = useState(false);

  // Sincronizar estado quando editingEvent muda
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || '');
        setTime(editingEvent.time || '');
        setDuration(editingEvent.duration?.toString() || '60');
        setIsAllDay(editingEvent.isAllDay || false);
        setSelectedTags(getTagIds(editingEvent.tags));
        setRecurrenceRule(editingEvent.recurrenceRule || null);
      } else {
        // Novo evento - limpar campos
        setTitle('');
        setDescription('');
        setTime('');
        setDuration('60');
        setIsAllDay(false);
        setSelectedTags([]);
        setRecurrenceRule(null);
      }
      setShowValidation(false);
    }
  }, [editingEvent, isOpen]);

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
      isRecurring: !!recurrenceRule,
      recurrenceRule: recurrenceRule || undefined,
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
    setRecurrenceRule(null);
    setShowValidation(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[100vw] sm:max-w-lg max-h-[100vh] overflow-y-auto rounded-lg sm:rounded-xl shadow-lg flex flex-col gap-0 p-0">
        <DialogHeader className="border-b px-4 sm:px-5 pt-3 sm:pt-4 pb-2.5 sm:pb-3">
          <DialogTitle className="text-lg sm:text-xl font-bold">
            {editingEvent ? t('editEvent') : t('newEvent')}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {(() => {
              const date = new Date(selectedDate);
              const dayOfWeek = t(`day-${date.getDay()}` as any);
              const month = t(`month-${date.getMonth()}` as any);
              return `${dayOfWeek}, ${date.getDate()} de ${month} de ${date.getFullYear()}`;
            })()}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2.5 sm:space-y-3 p-3 sm:p-4">
          {/* Title field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-xs sm:text-sm font-semibold">
                {t('eventTitle')} <span className="text-red-500">*</span>
              </Label>
              {isValid && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('eventTitlePlaceholder')}
              autoFocus
              className={`text-sm ${showValidation && !isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {showValidation && !isValid && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {t('eventTitleRequired')}
              </p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs sm:text-sm font-semibold">
              {t('eventDescription')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('eventDescriptionPlaceholder')}
              className="min-h-16 sm:min-h-20 text-sm resize-none"
            />
          </div>

          {/* All-day and Recurrence toggles */}
          <div className="space-y-1">
            {/* All-day checkbox */}
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group">
              <Checkbox
                id="isAllDay"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(checked as boolean)}
              />
              <Label
                htmlFor="isAllDay"
                className="text-xs sm:text-sm font-medium cursor-pointer flex-1"
              >
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  {t('eventAllDay')}
                </div>
              </Label>
            </div>
          </div>

          {/* Time and Duration fields */}
          {!isAllDay && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                {/* Start Time */}
                <div className="space-y-1 p-2 rounded-lg border border-transparent bg-card shadow-sm hover:border-primary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <Label htmlFor="time" className="text-xs sm:text-sm font-semibold">
                      {t('eventTime')}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="time"
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="HH:MM"
                      className="text-xs sm:text-sm flex-1 font-mono"
                    />
                    <div className="flex-shrink-0">
                      <TimePicker
                        value={time}
                        onChange={(val) => setTime(val)}
                        label={t('eventTime')}
                      />
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1 p-2 rounded-lg border border-transparent bg-card shadow-sm hover:border-primary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <Label htmlFor="duration" className="text-xs sm:text-sm font-semibold">
                      {t('eventDuration')} (min)
                    </Label>
                  </div>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recurrence section */}
          <RecurrenceConfig 
            onRuleChange={setRecurrenceRule}
            initialRule={recurrenceRule || undefined}
          />

          {/* Tags section */}
          {availableTags.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs sm:text-sm font-semibold">{t('tags')}</Label>
              <div className="flex flex-wrap gap-1.5">
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
                    className="px-3 py-1.5 sm:py-2 rounded-full border transition-all text-xs sm:text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05] cursor-pointer"
                    style={{
                      borderColor: selectedTags.includes(tag.id) ? tag.color : tag.color + '40',
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : tag.color + '15',
                      color: selectedTags.includes(tag.id) ? tag.color : 'hsl(var(--foreground))',
                    }}
                    title={tag.name}
                  >
                    {selectedTags.includes(tag.id) && <span className="mr-1.5">✓</span>}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No tags message */}
          {availableTags.length === 0 && (
            <div className="border border-dashed border-border rounded-lg p-3 bg-muted/20">
              <p className="text-xs sm:text-sm text-muted-foreground text-center mb-1">
                {t('noTags')}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {t('createFirstTag')}
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-2 sm:pt-2.5 border-t px-4 sm:px-5 py-2.5 sm:py-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-2 order-last sm:order-none"
            style={{ display: editingEvent && onDelete ? 'flex' : 'none' }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('delete')}</span>
            <span className="sm:hidden">{t('delete')}</span>
          </Button>
          
          <div className="flex gap-2 ml-auto w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!isValid && showValidation}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              {editingEvent ? t('update') : t('create')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
