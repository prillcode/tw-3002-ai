import React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import type { Sector } from '../data/mockGalaxy';

export interface SectorInfoProps {
  sector: Sector;
}

/**
 * Sector information panel showing location, port, danger.
 */
export const SectorInfo: React.FC<SectorInfoProps> = ({ sector }) => {
  const getDangerColor = () => {
    switch (sector.danger) {
      case 'safe': return 'green';
      case 'caution': return 'yellow';
      case 'dangerous': return 'red';
    }
  };

  const getDangerIcon = () => {
    switch (sector.danger) {
      case 'safe': return '● Safe';
      case 'caution': return '● Caution';
      case 'dangerous': return '● DANGER';
    }
  };

  return (
    <Box 
      borderStyle="round" 
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      flexDirection="column"
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="cyan" bold>
          {`SECTOR ${sector.id} — ${sector.name.toUpperCase()}`}
        </Text>
        <Text color={getDangerColor()}>
          {getDangerIcon()}
        </Text>
      </Box>
      
      <Box marginTop={1}>
        {sector.port ? (
          <Box flexDirection="row">
            <Text color="muted">Port: </Text>
            <Text color="yellow">
              {`Class ${sector.port.class} `}
            </Text>
            <Text color="white">
              {`(${sector.port.type} ${sector.port.buying ? 'Buyer' : 'Seller'})`}
            </Text>
          </Box>
        ) : (
          <Text color="muted" dimColor>
            No port in this sector
          </Text>
        )}
      </Box>
      
      <Box marginTop={0}>
        {sector.npcs && sector.npcs > 0 ? (
          <Text color="muted" dimColor>
            {`${sector.npcs} ship${sector.npcs === 1 ? '' : 's'} detected`}
          </Text>
        ) : (
          <Text color="muted" dimColor>
            No ships detected
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default SectorInfo;
