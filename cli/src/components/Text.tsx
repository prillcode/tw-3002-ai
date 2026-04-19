import React from 'react';
import { Text as InkText, type TextProps as InkTextProps } from 'ink';

export type TextVariant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted';

export interface TextProps extends InkTextProps {
  /**
   * Semantic color variant.
   * @default "default"
   */
  variant?: TextVariant;
  
  /**
   * Bold text.
   * @default false
   */
  bold?: boolean;
  
  /**
   * Inverse colors (swap foreground/background).
   * @default false
   */
  inverse?: boolean;
}

const variantColors: Record<TextVariant, string> = {
  default: 'white',
  success: 'green',
  danger: 'red',
  warning: 'yellow',
  info: 'cyan',
  muted: 'gray',
};

/**
 * Colored text with semantic meaning.
 * 
 * @example
 * <Text variant="success">Credits: 5000</Text>
 * <Text variant="danger" bold>HULL CRITICAL</Text>
 * <Text variant="muted">Turns remaining: 45</Text>
 */
export const Text: React.FC<TextProps> = ({ 
  variant = 'default',
  bold = false,
  inverse = false,
  children,
  ...props 
}) => {
  const color = variantColors[variant];

  return (
    <InkText
      color={color}
      bold={bold}
      inverse={inverse}
      {...props}
    >
      {children}
    </InkText>
  );
};

export default Text;
