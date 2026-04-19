import React from 'react';
import { Box } from './Box';
import { Text } from './Text';
import type { Sector } from '../data/mockGalaxy';

export interface SectorMapProps {
  /** Current sector player is in */
  currentSector: Sector;
  /** Neighboring sectors */
  neighbors: Sector[];
  /** Which neighbor is currently selected */
  selectedIndex: number;
}

/**
 * ASCII visual map of current sector and neighbors.
 * Renders a radial diagram showing connections.
 */
export const SectorMap: React.FC<SectorMapProps> = ({
  currentSector,
  neighbors,
  selectedIndex
}) => {
  // Limit to max 6 neighbors for clean display
  const displayNeighbors = neighbors.slice(0, 6);
  
  return (
    <Box 
      borderStyle="double" 
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      flexDirection="column"
      alignItems="center"
      minWidth={40}
    >
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          Sector Map
        </Text>
      </Box>
      
      {/* Visual diagram */}
      <Box flexDirection="column" alignItems="center">
        {/* Top neighbor (if exists) */}
        {displayNeighbors[0] && (
          <SectorNode 
            sector={displayNeighbors[0]} 
            isSelected={selectedIndex === 0}
          />
        )}
        
        {/* Connection line down */}
        {displayNeighbors[0] && <Text color="muted">│</Text>}
        
        {/* Middle row: left - current - right */}
        <Box flexDirection="row" alignItems="center">
          {/* Left neighbor */}
          {displayNeighbors[1] ? (
            <>
              <SectorNode 
                sector={displayNeighbors[1]} 
                isSelected={selectedIndex === 1}
              />
              <Text color="muted">─</Text>
            </>
          ) : (
            <Box width={8} />
          )}
          
          {/* Current sector */}
          <Box 
            borderStyle="round" 
            borderColor="yellow"
            paddingX={2}
            paddingY={1}
            marginX={1}
          >
            <Text color="yellow" bold>
              ★ {currentSector.id} ★
            </Text>
            <Text color="yellow" dimColor>
              YOU
            </Text>
          </Box>
          
          {/* Right neighbor */}
          {displayNeighbors[2] ? (
            <>
              <Text color="muted">─</Text>
              <SectorNode 
                sector={displayNeighbors[2]} 
                isSelected={selectedIndex === 2}
              />
            </>
          ) : (
            <Box width={8} />
          )}
        </Box>
        
        {/* Connection line down */}
        {displayNeighbors[3] && <Text color="muted">│</Text>}
        
        {/* Bottom neighbors */}
        {(displayNeighbors[3] || displayNeighbors[4] || displayNeighbors[5]) && (
          <Box flexDirection="row" alignItems="center" marginTop={0}>
            {displayNeighbors[3] && (
              <>
                <Text color="muted">│</Text>
                <Box marginX={1} />
              </>
            )}
            
            {displayNeighbors[3] && (
              <SectorNode 
                sector={displayNeighbors[3]} 
                isSelected={selectedIndex === 3}
              />
            )}
            
            {displayNeighbors[4] && (
              <>
                <Box marginX={1} />
                <SectorNode 
                  sector={displayNeighbors[4]} 
                  isSelected={selectedIndex === 4}
                />
              </>
            )}
            
            {displayNeighbors[5] && (
              <>
                <Box marginX={1} />
                <SectorNode 
                  sector={displayNeighbors[5]} 
                  isSelected={selectedIndex === 5}
                />
              </>
            )}
          </Box>
        )}
      </Box>
      
      <Box paddingY={0} />
      
      <Text color="muted" dimColor>
        {neighbors.length} warp lanes available
      </Text>
    </Box>
  );
};

/** Individual sector node in the map */
const SectorNode: React.FC<{
  sector: Sector;
  isSelected: boolean;
}> = ({ sector, isSelected }) => {
  const borderColor = isSelected ? 'green' : 'white';
  const textColor = isSelected ? 'green' : 'white';
  
  return (
    <Box 
      borderStyle={isSelected ? 'round' : 'single'}
      borderColor={borderColor}
      paddingX={1}
      paddingY={0}
      minWidth={6}
      alignItems="center"
    >
      <Text color={textColor} bold={isSelected}>
        {isSelected ? '→' : ''}{sector.id}
      </Text>
      {sector.port && (
        <Text color="yellow" dimColor>
          P
        </Text>
      )}
    </Box>
  );
};

export default SectorMap;
