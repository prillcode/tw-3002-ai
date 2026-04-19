import React, { useState } from 'react';
import { useInput } from 'ink';
import { Box } from './Box';
import { Text } from './Text';

export interface MenuItem {
  id: string;
  label: string;
}

export interface MenuProps {
  /**
   * Menu items to display.
   */
  items: MenuItem[];
  
  /**
   * Callback when an item is selected.
   */
  onSelect: (id: string) => void;
  
  /**
   * Callback when menu is cancelled (Escape pressed).
   */
  onCancel?: () => void;
  
  /**
   * Initially selected item index.
   * @default 0
   */
  initialIndex?: number;
}

/**
 * Keyboard-navigable menu component.
 * Use arrow keys to move selection, Enter to select, Escape to cancel.
 * 
 * @example
 * <Menu
 *   items={[{id: 'new', label: 'New Game'}, {id: 'continue', label: 'Continue'}]}
   *   onSelect={(id) => console.log('Selected:', id)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
export const Menu: React.FC<MenuProps> = ({ 
  items, 
  onSelect, 
  onCancel,
  initialIndex = 0 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (key.return) {
      if (items[selectedIndex]) {
        onSelect(items[selectedIndex].id);
      }
    } else if (key.escape && onCancel) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {items.map((item, index) => (
        <Box key={item.id} paddingY={0}>
          <Text variant={index === selectedIndex ? 'info' : 'default'} bold={index === selectedIndex}>
            {index === selectedIndex ? '→ ' : '  '}{item.label}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default Menu;
