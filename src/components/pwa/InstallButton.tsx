import { Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InstallButtonProps {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => void;
}

export function InstallButton({ canInstall, isInstalled, isIOS, onInstall }: InstallButtonProps) {
  if (isInstalled) return null;

  if (canInstall) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={onInstall}
        className="h-8 gap-1.5 px-2.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-transparent"
        aria-label="Install WeatherBoard PWA"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </Button>
    );
  }

  if (isIOS) {
    return (
      <div
        className="hidden md:flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]"
        title="Tap Share then Add to Home Screen"
      >
        <Share className="h-3 w-3" />
        <span>Install: Share → Add to Home</span>
      </div>
    );
  }

  return null;
}
