import React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import type { Sector } from '../data/mockGalaxy';

export interface SectorListProps {
  /** Connected sectors to display */
  sectors: Sector[];
  /** Currently selected index */
  selectedIndex: number;
}

/**
 * List of connected sectors with selection indicator.
 * Keyboard navigation handled by parent.
 */
export const SectorList: React.FC<SectorListProps> = ({
  sectors,
  selectedIndex
}) => {
  const getDangerIcon = (danger: string) => {
    switch (danger) {
      case 'safe': return '●';
      case 'caution': return '◐';
      case 'dangerous': return '◉';
    }
  };

  const getDangerColor = (danger: string) => {
    switch (danger) {
      case 'safe': return 'green';
      case 'caution': return 'yellow';
      case 'dangerous': return 'red';
    }
  };

  return (
    <Box 
      borderStyle="single" 
      borderColor="cyan"
      paddingX={1}
      paddingY={1}
      flexDirection="column"
      minWidth={30}
    >
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Connected Sectors:
        </Text>
      </Box>
      
      {sectors.length === 0 ? (
        <Text color="muted" dimColor>
          No connections
        </Text>
      ) : (
        sectors.map((sector, index) => {
          const isSelected = index === selectedIndex;
          
          return (
            <Box key={sector.id} flexDirection="row" marginY={0}>
              <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                {isSelected ? '→ ' : '  '}
              </Text>
              
              <Box width={6}>
                <Text 
                  color={isSelected ? 'white' : undefined}
                  bold={isSelected}
                >
                  {`[${sector.id}]`}
                </Text>
              </Box>
              
              <Box width={2} />
              
              <Box width={10}>
                {sector.port ? (
                  <Text color="yellow" dimColor={!isSelected}>
                    {`Port ${sector.port.class}`}
                  </Text>
                ) : (
                  <Text color="muted" dimColor>
                    No port
                  </Text>
                )}
              </Box>
              
              <Box width={2} />
              
              <Text color={getDangerColor(sector.danger)}>
                {getDangerIcon(sector.danger)}
              </Text>
            </Box>
          );
        })
      )}
    </Box>
  );
};

export default SectorList;
