import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { formatRelativeTime } from '@/lib/dates';

interface OfflineBannerProps {
  isOnline: boolean;
  lastCityName?: string;
  lastUpdated?: number;
}

export function OfflineBanner({ isOnline, lastCityName, lastUpdated }: OfflineBannerProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-medium"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                You're offline.{' '}
                {lastCityName ? (
                  <>
                    Showing last saved weather for <span className="font-semibold">{lastCityName}</span>
                    {lastUpdated ? `, updated ${formatRelativeTime(lastUpdated)}` : ''}.
                  </>
                ) : (
                  'Cached weather data will be shown when available.'
                )}
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] opacity-80">
              Search disabled until reconnected
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
