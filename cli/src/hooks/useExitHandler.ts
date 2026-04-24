import { useEffect } from 'react';

export interface UseExitHandlerOptions {
  /** Called when SIGINT is received (Ctrl+C). Return true to allow exit. */
  onExit?: () => boolean | void;
  /** Whether the handler is active. */
  enabled?: boolean;
}

/**
 * Intercept Ctrl+C (SIGINT) to allow graceful cleanup before exit.
 *
 * @example
 * useExitHandler({
 *   onExit: () => {
 *     saveGame(db, slot, state);
 *     return true; // allow exit
 *   },
 *   enabled: appMode === 'sector',
 * });
 */
export function useExitHandler(options: UseExitHandlerOptions) {
  const { onExit, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = () => {
      const allow = onExit ? onExit() !== false : true;
      if (allow) {
        process.exit(0);
      }
    };

    process.on('SIGINT', handler);
    return () => {
      process.off('SIGINT', handler);
    };
  }, [enabled, onExit]);
}

export default useExitHandler;
