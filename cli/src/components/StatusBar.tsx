import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface StatusBarItem {
  /** Key or key combination to display. */
  key: string;
  
  /** Action description. */
  action: string;
}

export interface StatusBarProps {
  /**
   * Key-action pairs to display.
   */
  items: StatusBarItem[];
}

/**
 * Persistent bottom bar showing available keys and actions.
 * Should be rendered at the bottom of the screen, always visible.
 * 
 * @example
 * <StatusBar items={[
 *   { key: '↑↓', action: 'Navigate' },
 *   { key: 'Enter', action: 'Select' },
 *   { key: 'Q', action: 'Quit' }
 * ]} />
 */
export const StatusBar: React.FC<StatusBarProps> = ({ items }) => {
  return (
    <Box borderStyle="single" paddingX={1} paddingY={0}>
      <Text>
        {items.map((item, index) => (
          <Text key={`${item.key}-${index}`}>
            <Text color="cyan" bold>[{item.key}]</Text>
            <Text color="gray"> {item.action}</Text>
            {index < items.length - 1 && <Text color="gray">  </Text>}
          </Text>
        ))}
      </Text>
    </Box>
  );
};

export default StatusBar;
