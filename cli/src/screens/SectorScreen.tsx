import React, { useState } from 'react';
import { Box, Text, SectorMap, SectorList, SectorInfo, ShipStatus } from '../components';
import { useKeyHandler } from '../hooks';
import { getSector, getNeighbors, type Sector } from '../data/mockGalaxy';

export interface SectorScreenProps {
  /** Navigate to market screen. */
  onMarket: () => void;
  
  /** Go back to previous screen. */
  onBack: () => void;
  
  /** Ship name to display. */
  shipName: string;
  
  /** Starting sector ID. */
  startingSector?: number;
}

/**
 * Sector view screen - main game navigation hub.
 * 
 * Features:
 * - Visual sector map with ASCII representation
 * - Interactive list of connected sectors
 * - Ship status panel (always visible)
 * - Keyboard navigation (↑↓ to select, Enter to jump)
 */
export const SectorScreen: React.FC<SectorScreenProps> = ({ 
  onMarket, 
  onBack,
  shipName,
  startingSector = 42
}) => {
  // Track current sector
  const [currentSectorId, setCurrentSectorId] = useState(startingSector);
  const currentSector = getSector(currentSectorId)!;
  const neighbors = getNeighbors(currentSectorId);
  
  // Track selection for navigation
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Mock ship status (will be real state in later phases)
  const [shipStatus, setShipStatus] = useState({
    credits: 5000,
    cargo: {
      ore: 10,
      organics: 5,
      equipment: 0,
      total: 15,
      max: 100
    },
    hull: 100,
    turns: 95,
    maxTurns: 100
  });

  // Handle jump to selected sector
  const handleJump = () => {
    if (neighbors.length === 0) return;
    
    const targetSector = neighbors[selectedIndex];
    if (!targetSector) return;
    
    // Update sector
    setCurrentSectorId(targetSector.id);
    
    // Decrement turns (fuel consumption)
    setShipStatus(prev => ({
      ...prev,
      turns: Math.max(0, prev.turns - 1)
    }));
    
    // Reset selection
    setSelectedIndex(0);
  };

  // Keyboard handling
  useKeyHandler({
    onUp: () => {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    },
    onDown: () => {
      setSelectedIndex(prev => (prev < neighbors.length - 1 ? prev + 1 : prev));
    },
    onReturn: handleJump,
    onM: () => {
      if (currentSector.port) {
        onMarket();
      }
    },
    onQ: () => {
      process.exit(0);
    },
    onEscape: onBack,
  });

  // Get sector for display (for jump preview)
  const selectedSector = neighbors[selectedIndex];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Sector Info Header */}
      <SectorInfo sector={currentSector} />
      
      <Box paddingY={1} />
      
      {/* Main content area: Map | List | Status */}
      <Box flexDirection="row" justifyContent="space-between">
        {/* Left: Sector List */}
        <SectorList 
          sectors={neighbors}
          selectedIndex={selectedIndex}
        />
        
        {/* Center: Visual Map */}
        <Box marginX={1}>
          <SectorMap
            currentSector={currentSector}
            neighbors={neighbors}
            selectedIndex={selectedIndex}
          />
        </Box>
        
        {/* Right: Ship Status */}
        <ShipStatus
          shipName={shipName}
          credits={shipStatus.credits}
          cargo={shipStatus.cargo}
          hull={shipStatus.hull}
          turns={shipStatus.turns}
          maxTurns={shipStatus.maxTurns}
          currentSector={currentSectorId}
        />
      </Box>
      
      <Box paddingY={1} />
      
      {/* Jump preview / status message */}
      <Box 
        borderStyle="single" 
        borderColor={selectedSector ? 'green' : 'muted'}
        paddingX={2}
        paddingY={1}
        alignItems="center"
      >
        {selectedSector ? (
          <Text>
            <Text color="cyan">Selected: </Text>
            <Text bold>Sector {selectedSector.id}</Text>
            <Text color="muted"> — {selectedSector.name}</Text>
            {selectedSector.port && (
              <Text color="yellow"> (Port Class {selectedSector.port.class})</Text>
            )}
            <Text color="green"> — [Enter] to Jump (1 turn)</Text>
          </Text>
        ) : (
          <Text color="muted">No warp lanes available</Text>
        )}
      </Box>
      
      {/* No turns warning */}
      {shipStatus.turns === 0 && (
        <Box marginTop={1} alignItems="center">
          <Text color="red" bold>
            ⚠ OUT OF TURNS — Cannot jump!
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default SectorScreen;
