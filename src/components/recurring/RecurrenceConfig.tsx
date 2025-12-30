import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatRecurrenceRule, validateRecurrenceRule } from '@/lib/utils/recurrenceUtils';
import type { RecurrenceRule } from '@/types/calendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertCircle, Repeat2, Infinity } from 'lucide-react';

interface RecurrenceConfigProps {
  onRuleChange?: (rule: RecurrenceRule | null) => void;
  initialRule?: RecurrenceRule;
  disabled?: boolean;
}

export const RecurrenceConfig = ({
  onRuleChange,
  initialRule,
  disabled = false,
}: RecurrenceConfigProps) => {
  const { t } = useLanguage();
  const [isRecurring, setIsRecurring] = useState(!!initialRule);
  const [rule, setRule] = useState<RecurrenceRule>(
    initialRule || {
      frequency: 'weekly',
      interval: 1,
      unlimited: false,
      maxOccurrences: 12,
    }
  );

  const [useEndDate, setUseEndDate] = useState(!!initialRule?.endDate);
  const [useUnlimited, setUseUnlimited] = useState(initialRule?.unlimited || false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    const newRule = { ...rule, frequency };
    updateRule(newRule);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = Math.max(1, parseInt(e.target.value) || 1);
    updateRule({ ...rule, interval });
  };

  const handleMaxOccurrencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxOccurrences = Math.max(1, parseInt(e.target.value) || 1);
    updateRule({ ...rule, maxOccurrences, endDate: undefined, unlimited: false });
    setUseEndDate(false);
    setUseUnlimited(false);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateRule({ ...rule, endDate: e.target.value, maxOccurrences: undefined, unlimited: false });
  };

  const handleUnlimitedToggle = (checked: boolean) => {
    setUseUnlimited(checked);
    if (checked) {
      updateRule({ ...rule, unlimited: true, endDate: undefined, maxOccurrences: undefined });
      setUseEndDate(false);
    } else {
      updateRule({ ...rule, unlimited: false, maxOccurrences: 12 });
    }
  };

  const updateRule = (newRule: RecurrenceRule) => {
    setRule(newRule);
    const validation = validateRecurrenceRule(newRule);
    setErrors(validation.errors);

    if (validation.valid && onRuleChange) {
      onRuleChange(newRule);
    }
  };

  const handleToggleRecurrence = () => {
    const newIsRecurring = !isRecurring;
    setIsRecurring(newIsRecurring);

    if (newIsRecurring) {
      onRuleChange?.(rule);
    } else {
      onRuleChange?.(null);
      setErrors([]);
    }
  };

  if (!isRecurring) {
    return (
      <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
           onClick={handleToggleRecurrence}>
        <Checkbox
          id="is-recurring"
          checked={isRecurring}
          onCheckedChange={handleToggleRecurrence}
          disabled={disabled}
        />
        <Label
          htmlFor="is-recurring"
          className="text-xs sm:text-sm font-medium cursor-pointer flex-1"
        >
          <div className="flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            {t('event.recurring')}
          </div>
        </Label>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-3 sm:p-3.5 rounded-lg border border-border bg-muted/30">
      {/* Header with toggle */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Repeat2 className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="freq-trigger" className="text-xs sm:text-sm font-semibold block mb-0.5">
              {t('event.recurring')}
            </Label>
            <p className="text-xs text-muted-foreground">
              {formatRecurrenceRule(rule, t)}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleRecurrence}
          disabled={disabled}
          className="h-8 px-2 text-xs"
        >
          {t('remove')}
        </Button>
      </div>

      {/* Frequency and Interval Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="frequency" className="text-xs font-semibold">
            {t('recurrence.frequency')}
          </Label>
          <Select value={rule.frequency} onValueChange={handleFrequencyChange} disabled={disabled}>
            <SelectTrigger id="frequency" className="text-xs sm:text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('recurrence.daily')}</SelectItem>
              <SelectItem value="weekly">{t('recurrence.weekly')}</SelectItem>
              <SelectItem value="biweekly">{t('recurrence.biweekly')}</SelectItem>
              <SelectItem value="monthly">{t('recurrence.monthly')}</SelectItem>
              <SelectItem value="yearly">{t('recurrence.yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="interval" className="text-xs font-semibold">
            {t('recurrence.interval')}
          </Label>
          <Input
            id="interval"
            type="number"
            min="1"
            value={rule.interval || 1}
            onChange={handleIntervalChange}
            disabled={disabled}
            className="text-xs sm:text-sm h-8"
          />
        </div>
      </div>

      {/* Occurrence Limit */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t('recurrence.occurrenceLimit')}</Label>
        
        <div className="flex gap-2">
          {!useEndDate ? (
            <>
              <Input
                type="number"
                min="1"
                value={rule.maxOccurrences || 12}
                onChange={handleMaxOccurrencesChange}
                disabled={disabled || useUnlimited}
                className="text-xs sm:text-sm h-8 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseEndDate(true)}
                disabled={disabled || useUnlimited}
                className="text-xs h-8 px-2"
              >
                {t('recurrence.useEndDate')}
              </Button>
            </>
          ) : (
            <>
              <Input
                type="date"
                value={rule.endDate || ''}
                onChange={handleEndDateChange}
                disabled={disabled || useUnlimited}
                className="text-xs sm:text-sm h-8 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUseEndDate(false);
                  updateRule({ ...rule, endDate: undefined, maxOccurrences: 12 });
                }}
                disabled={disabled || useUnlimited}
                className="text-xs h-8 px-2"
              >
                {t('recurrence.useMaxOccurrences')}
              </Button>
            </>
          )}
          {/* Unlimited Button - Icon Only */}
          <Button
            variant={useUnlimited ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleUnlimitedToggle(!useUnlimited)}
            disabled={disabled}
            className="h-8 w-8 p-0 flex items-center justify-center"
            title={t('recurrence.unlimitedOccurrence')}
          >
            <Infinity className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive space-y-1">
          {errors.map((error, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurrenceConfig;
