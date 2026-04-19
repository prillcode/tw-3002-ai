import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface CargoDisplayProps {
  cargo: {
    ore: number;
    organics: number;
    equipment: number;
  };
  maxCargo: number;
}

/**
 * Visual cargo hold display with capacity bar.
 * Shows current load and available space.
 */
export const CargoDisplay: React.FC<CargoDisplayProps> = ({
  cargo,
  maxCargo
}) => {
  const total = cargo.ore + cargo.organics + cargo.equipment;
  const percentage = Math.round((total / maxCargo) * 100);
  
  const getColor = () => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const getBarChars = () => {
    const filled = Math.round((total / maxCargo) * 20);
    const empty = 20 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Text color="muted">Cargo: </Text>
        <Text color={getColor()} bold>
          [{getBarChars()}]
        </Text>
        <Text color={getColor()}>
          {` ${total}/${maxCargo} (${percentage}%)`}
        </Text>
      </Box>
      
      <Box flexDirection="row" gap={3} marginTop={0}>
        <Text color="white">
          Ore: {cargo.ore}
        </Text>
        <Text color="white">
          Org: {cargo.organics}
        </Text>
        <Text color="white">
          Equip: {cargo.equipment}
        </Text>
        <Text color="muted">
          Free: {maxCargo - total}
        </Text>
      </Box>
    </Box>
  );
};

export default CargoDisplay;
