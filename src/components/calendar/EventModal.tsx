import React, { useState, useEffect } from 'react';
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
import { MaskedTimeInput } from '@/components/ui/masked-time-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { Trash2, AlertCircle, Check, Clock, Timer, Sun } from 'lucide-react';
import { getTagIds } from '@/lib/utils/eventUtils';
import { getContrastColor } from '@/lib/utils/colorUtils';
import type { Event, EventInput, EventTag, RecurrenceRule } from '@/types/calendar';
import { isValid, parse } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { RecurrenceConfig, RecurrencePreview } from '@/components/recurring';
import { storageAdapter } from '@/lib/adapters/storageAdapter';
import { logger } from '@/lib/logger';
import { formatTimeHHMM } from '@/utils/formatters';

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
  const [date, setDate] = useState<string>(editingEvent?.date || selectedDate);
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [time, setTime] = useState(editingEvent?.time ? formatTimeHHMM(editingEvent.time) : '');
  const [duration, setDuration] = useState(editingEvent?.duration?.toString() || '60');
  const [isAllDay, setIsAllDay] = useState(editingEvent?.isAllDay || false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    editingEvent ? getTagIds(editingEvent.tags) : []
  );
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    editingEvent?.recurrenceRule || null
  );
  const [showValidation, setShowValidation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sincronizar estado quando editingEvent muda
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setDate(editingEvent.date);
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || '');
        setTime(editingEvent.time ? formatTimeHHMM(editingEvent.time) : '');
        setDuration(editingEvent.duration?.toString() || '60');
        // Initialize all-day based on explicit flag or absence of time
        setIsAllDay(editingEvent.isAllDay ?? !editingEvent.time);
        setSelectedTags(getTagIds(editingEvent.tags));
        setRecurrenceRule(editingEvent.recurrenceRule || null);
        // If this is an instance missing rule, try to load parent and hydrate rule
        if (!editingEvent.recurrenceRule && editingEvent.recurringEventId) {
          (async () => {
            try {
              const parent = await storageAdapter.getEvent(editingEvent.recurringEventId!);
              if (parent && parent.recurrenceRule) {
                logger.debug('ui.eventModal.hydrateRecurrenceRule.fromParent', {
                  instanceId: editingEvent.id,
                  parentId: editingEvent.recurringEventId,
                });
                setRecurrenceRule(parent.recurrenceRule);
              }
            } catch (err) {
              logger.warn('ui.eventModal.hydrateRecurrenceRule.failed', { error: err });
            }
          })();
        }
      } else {
        // Novo evento - limpar campos
        setDate(selectedDate);
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

  const isFormValid = title.trim().length > 0;

  const handleSave = () => {
    if (!isFormValid) {
      setShowValidation(true);
      return;
    }

    const input: EventInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      isAllDay,
      time: isAllDay ? undefined : (time || undefined),
      duration: isAllDay ? undefined : (duration ? parseInt(duration) : undefined),
      tags: selectedTags,
      isRecurring: !!recurrenceRule,
      recurrenceRule: recurrenceRule || undefined,
    };

    logger.debug('ui.eventModal.save.input', {
      date,
      title: input.title,
      isAllDay: input.isAllDay,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule,
      tagsCount: input.tags?.length || 0,
    });

    onSave(input);
    handleClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
      setShowDeleteConfirm(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setDate(selectedDate);
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
    <>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEvent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteEventConfirm')}
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

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <ModalContent size="lg">
        <DialogHeader className="border-b bg-gradient-to-br from-card to-muted/30 px-4 sm:px-5 pt-4 sm:pt-4 pb-3 sm:pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {editingEvent ? t('editEvent') : t('newEvent')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            {(() => {
              // IMPORTANT: avoid `new Date('YYYY-MM-DD')` because it is parsed as UTC and
              // can shift the calendar day for users in negative timezones.
              const d = parse(date, 'yyyy-MM-dd', new Date());
              if (!isValid(d)) return date;
              const dayOfWeek = t(`day-${d.getDay()}` as any);
              const month = t(`month-${d.getMonth()}` as any);
              return `${dayOfWeek}, ${d.getDate()} de ${month} de ${d.getFullYear()}`;
            })()}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-3 p-4 sm:p-5 min-h-0">
          {/* Title field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-sm font-medium">
                {t('eventTitle')} <span className="text-destructive">*</span>
              </Label>
              {isFormValid && (
                <Check className="h-5 w-5 text-green-600" />
              )}
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('eventTitlePlaceholder')}
              className={`text-sm h-10 ${showValidation && !isFormValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            />
            {showValidation && !isFormValid && (
              <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="h-4 w-4" />
                {t('eventTitleRequired')}
              </p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {t('eventDescription')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('eventDescriptionPlaceholder')}
              className="min-h-24 sm:min-h-28 text-sm resize-none"
            />
          </div>

          {/* All-day and Recurrence toggles */}
          <div className="space-y-1.5">
            {/* All-day checkbox */}
            <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group">
              <Checkbox
                id="isAllDay"
                checked={isAllDay}
                onCheckedChange={(checked) => setIsAllDay(Boolean(checked))}
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
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start Time */}
                <div className="space-y-2 p-3 rounded-xl border-2 border-border bg-card shadow-sm hover:border-primary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <Label htmlFor="time" className="text-sm font-medium">
                      {t('eventTime')}
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <MaskedTimeInput
                      id="time"
                      value={time}
                      onChange={(val) => setTime(val)}
                      placeholder="HH:MM"
                      className="flex-1"
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
                <div className="space-y-2 p-3 rounded-xl border-2 border-border bg-card shadow-sm hover:border-primary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary flex-shrink-0" />
                    <Label htmlFor="duration" className="text-sm font-medium">
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
                    className="text-sm h-9"
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('tags')}</Label>
              <div className="flex flex-wrap gap-2">
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
                    className="px-3 py-2 rounded-full border-2 transition-all text-sm font-medium whitespace-nowrap hover:shadow-md hover:scale-[1.05] active:scale-95 cursor-pointer"
                    style={{
                      borderColor: selectedTags.includes(tag.id) ? tag.color : tag.color + '40',
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : tag.color + '15',
                      color: selectedTags.includes(tag.id) ? getContrastColor(tag.color) : 'hsl(var(--foreground))',
                    }}
                    title={tag.name}
                  >
                    {selectedTags.includes(tag.id) && <span className="mr-2">✓</span>}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No tags message */}
          {availableTags.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center mb-1.5">
                {t('noTags')}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                {t('createFirstTag')}
              </p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 justify-between border-t px-4 sm:px-5 py-3 sm:py-3 flex-shrink-0 bg-gradient-to-br from-muted/30 to-card">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="gap-2 order-last sm:order-none"
            style={{ display: editingEvent && onDelete ? 'flex' : 'none' }}
          >
            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
            {t('delete')}
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
              disabled={!isFormValid && showValidation}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              {editingEvent ? t('update') : t('create')}
            </Button>
          </div>
        </DialogFooter>
      </ModalContent>
      </Dialog>
    </>
  );
};
