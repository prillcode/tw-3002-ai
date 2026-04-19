import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface ShipStatusProps {
  shipName: string;
  credits: number;
  cargo: {
    ore: number;
    organics: number;
    equipment: number;
    total: number;
    max: number;
  };
  hull: number;
  turns: number;
  maxTurns: number;
  currentSector: number;
}

/**
 * Compact ship status panel showing vitals.
 * Always visible during sector navigation.
 */
export const ShipStatus: React.FC<ShipStatusProps> = ({
  shipName,
  credits,
  cargo,
  hull,
  turns,
  maxTurns,
  currentSector
}) => {
  // Color coding based on thresholds
  const getCreditsColor = () => {
    if (credits < 100) return 'red';
    if (credits < 1000) return 'yellow';
    return 'green';
  };

  const getHullColor = () => {
    if (hull < 25) return 'red';
    if (hull < 75) return 'yellow';
    return 'green';
  };

  const getTurnsColor = () => {
    if (turns < 10) return 'red';
    if (turns < 30) return 'yellow';
    return 'green';
  };

  return (
    <Box 
      borderStyle="single" 
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      flexDirection="column"
    >
      <Text color="cyan" bold>
        {`⚡ ${shipName}`}
      </Text>
      
      <Box paddingY={1} />
      
      <Box flexDirection="row" gap={2}>
        <Box width={18}>
          <Text color="muted">Credits:</Text>
          <Text color={getCreditsColor()} bold>
            {credits.toLocaleString()}
          </Text>
        </Box>
        
        <Box width={16}>
          <Text color="muted">Cargo:</Text>
          <Text color={cargo.total > cargo.max * 0.8 ? 'yellow' : 'white'}>
            {cargo.total}/{cargo.max}
          </Text>
        </Box>
        
        <Box width={12}>
          <Text color="muted">Hull:</Text>
          <Text color={getHullColor()} bold>
            {hull}%
          </Text>
        </Box>
        
        <Box width={12}>
          <Text color="muted">Turns:</Text>
          <Text color={getTurnsColor()}>
            {turns}/{maxTurns}
          </Text>
        </Box>
      </Box>
      
      <Box paddingY={0} />
      
      <Text color="muted" dimColor>
        {`Location: Sector ${currentSector}`}
      </Text>
    </Box>
  );
};

export default ShipStatus;
