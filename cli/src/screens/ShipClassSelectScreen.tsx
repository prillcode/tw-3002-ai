import React, { useState } from 'react';
import { useInput } from 'ink';
import { Box, Text } from '../components';
import { getShipClasses } from '@tw3002/engine';
import type { ShipClass } from '@tw3002/engine';

export interface ShipClassSelectProps {
  onSelect: (classId: string) => void;
  onBack: () => void;
}

export const ShipClassSelectScreen: React.FC<ShipClassSelectProps> = ({
  onSelect,
  onBack,
}) => {
  const classes = getShipClasses();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < classes.length - 1 ? prev + 1 : prev));
    } else if (key.return) {
      onSelect(classes[selectedIndex]!.id);
    } else if (key.escape) {
      onBack();
    }
  });

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
        minWidth={54}
      >
        <Text color="cyan" bold>
          {'       CHOOSE YOUR SHIP CLASS       '}
        </Text>

        <Box paddingY={1} />

        <Text color="muted" dimColor>
          {'   Each class has different base stats.   '}
        </Text>

        <Box paddingY={1} />

        {classes.map((shipClass, index) => {
          const isSelected = index === selectedIndex;
          const s = shipClass.baseStats;
          return (
            <Box
              key={shipClass.id}
              flexDirection="column"
              borderStyle={isSelected ? 'round' : undefined}
              borderColor={isSelected ? 'cyan' : undefined}
              paddingX={isSelected ? 1 : 0}
              marginY={0}
            >
              <Box flexDirection="row">
                <Text
                  color={isSelected ? 'cyan' : 'white'}
                  bold={isSelected}
                >
                  {isSelected ? '▶ ' : '  '}
                  {shipClass.name}
                </Text>
              </Box>
              <Text color="yellow" dimColor>
                {'    '}{s.maxCargo} cargo, {s.maxHull} hull, {s.maxTurns} turns
              </Text>
              <Text color="muted" dimColor>
                {'    '}{shipClass.description}
              </Text>
            </Box>
          );
        })}

        <Box paddingY={1} />

        <Text color="muted" dimColor>
          {'   [↑↓] Select  [Enter] Choose  [Esc] Back   '}
        </Text>
      </Box>
    </Box>
  );
};

export default ShipClassSelectScreen;
