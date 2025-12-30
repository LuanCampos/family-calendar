import { format, parseISO, addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Event, RecurrenceRule } from '@/types/calendar';
import { generateRecurringInstances } from '@/lib/utils/recurrenceUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar } from 'lucide-react';

interface RecurrencePreviewProps {
  event: Event;
  rule: RecurrenceRule;
  maxPreviewItems?: number;
}

export const RecurrencePreview = ({
  event,
  rule,
  maxPreviewItems = 5,
}: RecurrencePreviewProps) => {
  const { t } = useLanguage();

  // Generate instances for preview
  const eventDate = parseISO(event.date);
  const previewEnd = addMonths(eventDate, 6);
  
  const instances = generateRecurringInstances(
    event,
    rule,
    event.date,
    format(previewEnd, 'yyyy-MM-dd')
  );

  // Only show max 4 items + "more" indicator
  const displayInstances = instances.slice(0, 4);
  const hasMore = instances.length > 4;

  return (
    <div className="space-y-1.5 p-3 sm:p-3.5 rounded-lg border border-border bg-primary/5">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <p className="text-xs sm:text-sm font-semibold">{t('recurrence.preview')}</p>
        <span className="text-xs text-muted-foreground ml-auto">
          {rule.unlimited ? '∞' : instances.length} {t('recurrence.occurrences')}
        </span>
      </div>

      <div className="space-y-1">
        {displayInstances.map((instance, idx) => (
          <div
            key={instance.id}
            className="flex items-center gap-2 text-xs sm:text-sm py-1.5 px-2 rounded hover:bg-accent/30 transition-colors"
          >
            <span className="text-muted-foreground font-medium min-w-6">#{idx + 1}</span>
            <Badge variant="secondary" className="whitespace-nowrap text-xs">
              {format(parseISO(instance.date), 'EEE, dd MMM')}
            </Badge>
            {instance.time && (
              <span className="text-muted-foreground text-xs">{instance.time}</span>
            )}
          </div>
        ))}
        
        {hasMore && (
          <div className="flex items-center gap-2 text-xs sm:text-sm py-1.5 px-2 text-muted-foreground">
            <span className="font-medium min-w-6">#5</span>
            <span className="text-lg font-light">…</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurrencePreview;
