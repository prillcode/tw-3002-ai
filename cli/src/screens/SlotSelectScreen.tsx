import React, { useMemo } from 'react';
import { useInput } from 'ink';
import { Box, Text } from '../components';
import type { Database } from '../db';
import { getAllSlotInfo, SLOT_NAMES } from '../db';

export interface SlotSelectScreenProps {
  db: Database;
  mode: 'new' | 'continue';
  onSelectSlot: (slotId: number, isEmpty: boolean) => void;
  onBack: () => void;
}

/**
 * Slot selection screen for choosing which galaxy to play.
 * Shows 3 slots (Galaxy A, B, C) with their status.
 */
export const SlotSelectScreen: React.FC<SlotSelectScreenProps> = ({
  db,
  mode,
  onSelectSlot,
  onBack
}) => {
  // Memoize slots to prevent re-fetching on every render
  const slots = useMemo(() => getAllSlotInfo(db), [db]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  // Filter to only saved slots if in continue mode
  const availableSlots = mode === 'continue' 
    ? slots.filter(s => !s.isEmpty)
    : slots;
  
  // Reset index if out of bounds (safety)
  React.useEffect(() => {
    if (selectedIndex >= availableSlots.length && availableSlots.length > 0) {
      setSelectedIndex(availableSlots.length - 1);
    }
  }, [availableSlots.length, selectedIndex]);
  
  // If continue mode and no saves, show message
  if (mode === 'continue' && availableSlots.length === 0) {
    return (
      <Box flexDirection="column" alignItems="center" padding={2}>
        <Box borderStyle="round" borderColor="red" padding={2}>
          <Text color="red" bold>No Saved Games</Text>
          <Box paddingY={1} />
          <Text color="muted">You don't have any saved games to continue.</Text>
          <Text color="muted">Start a New Game to play.</Text>
        </Box>
        <Box paddingY={2} />
        <Text color="muted" dimColor>[Esc] Back to Menu</Text>
      </Box>
    );
  }
  
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : prev;
        return newIndex;
      });
    } else if (key.downArrow) {
      setSelectedIndex(prev => {
        const maxIndex = availableSlots.length - 1;
        const newIndex = prev < maxIndex ? prev + 1 : prev;
        return newIndex;
      });
    } else if (key.return) {
      const slot = availableSlots[selectedIndex];
      if (slot) {
        onSelectSlot(slot.slotId, slot.isEmpty);
      }
    } else if (key.escape) {
      onBack();
    }
  });
  
  const formatTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  
  return (
    <Box 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      padding={2}
    >
      <Box 
        borderStyle="double" 
        borderColor="cyan"
        paddingX={4}
        paddingY={2}
        flexDirection="column"
        minWidth={50}
      >
        <Text color="cyan" bold>
          {'        SELECT GALAXY TO PLAY        '}
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="muted" dimColor>
          {mode === 'new' 
            ? '    Choose a galaxy to start your journey    '
            : '       Choose a galaxy to continue       '
          }
        </Text>
        
        <Box paddingY={1} />
        
        {/* Slot list */}
        {mode === 'new' ? (
          // Show all 3 slots in new game mode
          slots.map((slot, index) => {
            const isSelected = index === selectedIndex;
            
            return (
              <Box 
                key={slot.slotId}
                flexDirection="column"
                borderStyle={isSelected ? 'round' : undefined}
                borderColor={isSelected ? 'cyan' : undefined}
                paddingX={isSelected ? 1 : 0}
                paddingY={0}
                marginY={0}
              >
                <Box flexDirection="row">
                  <Text 
                    color={isSelected ? 'cyan' : 'white'} 
                    bold={isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {SLOT_NAMES[slot.slotId]}
                  </Text>
                </Box>
                
                {slot.isEmpty ? (
                  <Text color="muted" dimColor>
                    {'    '}[New Game]
                  </Text>
                ) : (
                  <Box flexDirection="column">
                    <Text color="yellow">
                      {'    '}{slot.shipName}
                    </Text>
                    <Box flexDirection="row">
                      <Text color="green">
                        {'    '}{slot.credits?.toLocaleString()} cr
                      </Text>
                      <Text color="muted" dimColor>
                        {'  • '}{formatTimeAgo(slot.updatedAt)}
                      </Text>
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })
        ) : (
          // Show only saved slots in continue mode
          availableSlots.map((slot, index) => {
            const isSelected = index === selectedIndex;
            
            return (
              <Box 
                key={slot.slotId}
                flexDirection="column"
                borderStyle={isSelected ? 'round' : undefined}
                borderColor={isSelected ? 'cyan' : undefined}
                paddingX={isSelected ? 1 : 0}
                paddingY={0}
                marginY={0}
              >
                <Box flexDirection="row">
                  <Text 
                    color={isSelected ? 'cyan' : 'white'} 
                    bold={isSelected}
                  >
                    {isSelected ? '▶ ' : '  '}
                    {SLOT_NAMES[slot.slotId]}
                  </Text>
                </Box>
                
                <Text color="yellow">
                  {'    '}{slot.shipName}
                </Text>
                <Box flexDirection="row">
                  <Text color="green">
                    {'    '}{slot.credits?.toLocaleString()} cr
                  </Text>
                  <Text color="muted" dimColor>
                    {'  • '}{formatTimeAgo(slot.updatedAt)}
                  </Text>
                </Box>
              </Box>
            );
          })
        )}
        
        <Box paddingY={1} />
        
        <Text color="muted" dimColor>
          {'   [↑↓] Select  [Enter] Choose  [Esc] Back   '}
        </Text>
      </Box>
    </Box>
  );
};

export default SlotSelectScreen;
