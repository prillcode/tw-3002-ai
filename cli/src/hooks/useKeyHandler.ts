import { useInput, type Key } from 'ink';

export interface KeyHandlers {
  /** Up arrow pressed. */
  onUp?: () => void;
  
  /** Down arrow pressed. */
  onDown?: () => void;
  
  /** Left arrow pressed. */
  onLeft?: () => void;
  
  /** Right arrow pressed. */
  onRight?: () => void;
  
  /** Enter/Return pressed. */
  onReturn?: () => void;
  
  /** Escape pressed. */
  onEscape?: () => void;
  
  /** Q key pressed (quit). */
  onQ?: () => void;
  
  /** H key pressed (help). */
  onH?: () => void;
  
  /** M key pressed (market). */
  onM?: () => void;
  
  /** B key pressed (buy). */
  onB?: () => void;
  
  /** S key pressed (sell). */
  onS?: () => void;
  
  /** Any other key pressed. */
  onInput?: (input: string, key: Key) => void;
}

export interface UseKeyHandlerOptions extends KeyHandlers {
  /**
   * When false, all key handlers are disabled.
   * @default true
   */
  isActive?: boolean;
}

/**
 * Centralized keyboard input handling hook.
 * Wraps Ink's useInput with structured configuration.
 * 
 * @example
 * useKeyHandler({
 *   onUp: () => moveUp(),
 *   onDown: () => moveDown(),
 *   onReturn: () => select(),
 *   onEscape: () => goBack(),
 *   onQ: () => quit(),
 *   isActive: !isLoading
 * });
 */
export const useKeyHandler = (options: UseKeyHandlerOptions) => {
  const { isActive = true, ...handlers } = options;

  useInput((input, key) => {
    if (!isActive) return;

    if (key.upArrow && handlers.onUp) {
      handlers.onUp();
    } else if (key.downArrow && handlers.onDown) {
      handlers.onDown();
    } else if (key.leftArrow && handlers.onLeft) {
      handlers.onLeft();
    } else if (key.rightArrow && handlers.onRight) {
      handlers.onRight();
    } else if (key.return && handlers.onReturn) {
      handlers.onReturn();
    } else if (key.escape && handlers.onEscape) {
      handlers.onEscape();
    } else if (input === 'q' && handlers.onQ) {
      handlers.onQ();
    } else if (input === 'h' && handlers.onH) {
      handlers.onH();
    } else if (input === 'm' && handlers.onM) {
      handlers.onM();
    } else if (input === 'b' && handlers.onB) {
      handlers.onB();
    } else if (input === 's' && handlers.onS) {
      handlers.onS();
    } else if (handlers.onInput) {
      handlers.onInput(input, key);
    }
  });
};

export default useKeyHandler;
