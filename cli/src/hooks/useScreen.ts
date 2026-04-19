import { useState, useCallback } from 'react';

export type ScreenName = 'welcome' | 'sector' | 'market' | 'combat' | 'settings';

export interface UseScreenOptions {
  /**
   * Initial screen to display.
   * @default "welcome"
   */
  initial?: ScreenName;
  
  /**
   * Maximum history size for goBack.
   * @default 10
   */
  maxHistory?: number;
}

export interface ScreenState {
  /** Current active screen. */
  current: ScreenName;
  
  /** History stack for goBack navigation. */
  history: ScreenName[];
}

/**
 * Screen router hook for multi-screen navigation.
 * Tracks current screen and maintains history for back navigation.
 * 
 * @example
 * const { currentScreen, navigateTo, goBack, canGoBack } = useScreen({
 *   initial: 'welcome'
 * });
 * 
 * // Render based on current screen
 * if (currentScreen === 'welcome') return <WelcomeScreen onStart={() => navigateTo('sector')} />;
 * if (currentScreen === 'sector') return <SectorScreen onTrade={() => navigateTo('market')} />;
 */
export const useScreen = (options: UseScreenOptions = {}) => {
  const { initial = 'welcome', maxHistory = 10 } = options;
  
  const [state, setState] = useState<ScreenState>({
    current: initial,
    history: []
  });

  /**
   * Navigate to a new screen, adding current to history.
   */
  const navigateTo = useCallback((screen: ScreenName) => {
    setState(prev => ({
      current: screen,
      history: [...prev.history.slice(-maxHistory + 1), prev.current]
    }));
  }, [maxHistory]);

  /**
   * Go back to previous screen from history.
   * Returns true if navigation occurred, false if no history.
   */
  const goBack = useCallback((): boolean => {
    let navigated = false;
    
    setState(prev => {
      if (prev.history.length === 0) {
        navigated = false;
        return prev;
      }
      
      const newHistory = [...prev.history];
      const previousScreen = newHistory.pop()!;
      navigated = true;
      
      return {
        current: previousScreen,
        history: newHistory
      };
    });
    
    return navigated;
  }, []);

  /**
   * Check if goBack is possible.
   */
  const canGoBack = state.history.length > 0;

  return {
    currentScreen: state.current,
    navigateTo,
    goBack,
    canGoBack,
    history: state.history
  };
};

export default useScreen;
