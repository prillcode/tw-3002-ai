import React, { useState } from 'react';
import { Box, Text, SectorMap, SectorList, SectorInfo, ShipStatus, ConfirmDialog, WarpTransition } from '../components';
import { useKeyHandler } from '../hooks';
import { getSector, getNeighbors } from '../data/mockGalaxy';

export interface ShipState {
  name: string;
  credits: number;
  cargo: {
    ore: number;
    organics: number;
    equipment: number;
  };
  maxCargo: number;
  hull: number;
  turns: number;
  maxTurns: number;
}

export interface SectorScreenProps {
  /** Navigate to market screen. */
  onMarket: () => void;
  
  /** Go back to previous screen. */
  onBack: () => void;
  
  /** Ship name to display. */
  shipName: string;
  
  /** Starting sector ID. */
  currentSectorId: number;
  
  /** Update current sector on jump. */
  onUpdateSector: (sectorId: number) => void;
  
  /** Ship state. */
  shipState: ShipState;
  
  /** Update ship state. */
  onUpdateShip: (state: ShipState) => void;
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
  currentSectorId,
  onUpdateSector,
  shipState,
  onUpdateShip
}) => {
  const currentSector = getSector(currentSectorId)!;
  const neighbors = getNeighbors(currentSectorId);
  
  // Track selection for navigation
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Track warp transition
  const [isWarping, setIsWarping] = useState(false);
  const [warpTarget, setWarpTarget] = useState<{id: number, name: string} | null>(null);
  
  // Track quit confirmation dialog
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Handle jump to selected sector - triggers warp transition
  const handleJump = () => {
    if (neighbors.length === 0) return;
    
    const targetSector = neighbors[selectedIndex];
    if (!targetSector) return;
    
    // Check turns
    if (shipState.turns <= 0) {
      return; // Can't jump without turns
    }
    
    // Start warp transition
    setWarpTarget({ id: targetSector.id, name: targetSector.name });
    setIsWarping(true);
  };
  
  // Complete the jump after warp animation
  const completeJump = () => {
    if (!warpTarget) return;
    
    // Update sector
    onUpdateSector(warpTarget.id);
    
    // Decrement turns (fuel consumption)
    onUpdateShip({
      ...shipState,
      turns: Math.max(0, shipState.turns - 1)
    });
    
    // Reset state
    setIsWarping(false);
    setWarpTarget(null);
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
      setShowQuitConfirm(true);
    },
    onEscape: onBack,
  });

  // Show warp transition
  if (isWarping && warpTarget) {
    return (
      <WarpTransition
        targetSector={warpTarget.id}
        sectorName={warpTarget.name}
        onComplete={completeJump}
        duration={2000}
      />
    );
  }

  // Show quit confirmation dialog
  if (showQuitConfirm) {
    return (
      <ConfirmDialog
        message="Quit the game and return to shell?"
        onConfirm={() => process.exit(0)}
        onCancel={() => setShowQuitConfirm(false)}
        defaultToConfirm={false}
      />
    );
  }

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
          credits={shipState.credits}
          cargo={shipState.cargo}
          maxCargo={shipState.maxCargo}
          hull={shipState.hull}
          turns={shipState.turns}
          maxTurns={shipState.maxTurns}
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
      {shipState.turns === 0 && (
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
