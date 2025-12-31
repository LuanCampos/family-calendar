import { Wifi, WifiOff, Cloud, Loader2 } from 'lucide-react';
import { useOnline } from '@/contexts/OnlineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const OnlineStatusBar = () => {
  const { isOnline, isSyncing, pendingSyncCount, syncNow } = useOnline();
  const { t } = useLanguage();

  // Não mostrar quando está online e sincronizado
  if (isOnline && pendingSyncCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-md border-2 transition-all duration-300',
      isOnline 
        ? 'bg-primary/90 border-primary/80 text-white' 
        : 'bg-amber-500/90 border-amber-400/80 text-white',
      'hover:scale-105 active:scale-95'
    )}>
      {isOnline ? (
        isSyncing ? (
          <Loader2 className="h-5 w-5 sm:h-5 sm:w-5 animate-spin" />
        ) : (
          <Wifi className="h-5 w-5 sm:h-5 sm:w-5" />
        )
      ) : (
        <WifiOff className="h-5 w-5 sm:h-5 sm:w-5" />
      )}
      
      <span className="text-sm sm:text-base font-bold">
        {isOnline 
          ? (isSyncing ? 'Sincronizando...' : t('online'))
          : t('offline')
        }
      </span>

      {pendingSyncCount > 0 && (
        <>
          <Badge variant="secondary" className="bg-white/30 text-white text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-1">
            {pendingSyncCount}
          </Badge>
          
          {isOnline && !isSyncing && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 sm:h-9 px-2 sm:px-3 text-white hover:bg-white/20 font-semibold"
              onClick={syncNow}
              disabled={isSyncing}
            >
              <Cloud className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};
