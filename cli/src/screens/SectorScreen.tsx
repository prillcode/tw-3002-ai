import React, { useState, useMemo } from 'react';
import { Box, Text, SectorMap, SectorList, SectorInfo, ShipStatus, ConfirmDialog, WarpTransition } from '../components';
import { useKeyHandler } from '../hooks';
import { getNeighborIds } from '@tw3002/engine';
import type { Galaxy, Sector, Combatant, NPC, NewsItem } from '@tw3002/engine';

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
  maxHull?: number;
  shield: number;
  maxShield: number;
  turns: number;
  maxTurns: number;
  netWorth?: number;
}

export interface SectorScreenProps {
  /** Navigate to market screen. */
  onMarket: () => void;

  /** Navigate to stardock screen. */
  onStarDock: () => void;

  /** Trigger combat encounter. */
  onCombat: (enemy: Combatant) => void;

  /** Called after jump completes (for encounter check). */
  onJumpComplete?: (sectorId: number) => void;

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

  /** Galaxy instance. */
  galaxy: Galaxy;

  /** Net worth for display. */
  netWorth?: number;

  /** NPCs in current sector. */
  npcs?: NPC[];

  /** Recent news headlines. */
  news?: NewsItem[];
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
  onStarDock,
  onCombat,
  onJumpComplete,
  onBack,
  shipName,
  currentSectorId,
  onUpdateSector,
  shipState,
  onUpdateShip,
  netWorth,
  npcs,
  news,
  galaxy,
}) => {
  const currentSector = galaxy.sectors.get(currentSectorId)!;
  const isStarDock = galaxy.stardocks.includes(currentSectorId);
  
  const neighborIds = useMemo(
    () => getNeighborIds(galaxy, currentSectorId),
    [galaxy, currentSectorId]
  );
  
  const neighbors = useMemo(
    () => neighborIds.map(id => galaxy.sectors.get(id)).filter((s): s is Sector => s !== undefined),
    [neighborIds, galaxy.sectors]
  );
  
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

    // Decrement turns and regenerate shield
    onUpdateShip({
      ...shipState,
      turns: Math.max(0, shipState.turns - 1),
      shield: shipState.maxShield, // shield regenerates between encounters
    });

    // Reset state
    setIsWarping(false);
    setWarpTarget(null);
    setSelectedIndex(0);

    // Notify app that jump is complete (for encounter checks)
    if (onJumpComplete) {
      onJumpComplete(warpTarget.id);
    }
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
    onD: () => {
      if (isStarDock) {
        onStarDock();
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
      <SectorInfo sector={currentSector} isStarDock={isStarDock} />
      
      <Box paddingY={1} />
      
      {/* Main content area: Map | List | Status */}
      <Box flexDirection="row" justifyContent="space-between">
        {/* Left: Sector List */}
        <SectorList 
          sectors={neighbors}
          selectedIndex={selectedIndex}
          stardockIds={galaxy.stardocks}
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
          maxHull={shipState.maxHull ?? shipState.hull}
          shield={shipState.shield}
          maxShield={shipState.maxShield}
          turns={shipState.turns}
          maxTurns={shipState.maxTurns}
          currentSector={currentSectorId}
          netWorth={netWorth}
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
      
      {/* Low turns warning */}
      {shipState.turns === 0 && (
        <Box marginTop={1} alignItems="center">
          <Text color="red" bold>
            ⚠ OUT OF TURNS — Cannot jump!
          </Text>
        </Box>
      )}
      {shipState.turns > 0 && shipState.turns <= 20 && (
        <Box marginTop={1} alignItems="center">
          <Text color="yellow" bold>
            ⚠ LOW TURNS — {shipState.turns} remaining
          </Text>
        </Box>
      )}

      {/* StarDock hint */}
      {isStarDock && (
        <Box marginTop={1} alignItems="center">
          <Text color="magenta" bold>
            ⚡ StarDock detected — [D] to dock and upgrade ship
          </Text>
        </Box>
      )}

      {/* NPCs present */}
      {npcs && npcs.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {npcs.map(npc => {
            const rep = npc.memory.reputation?.['player'];
            const repText = rep
              ? rep.score > 30 ? 'friendly' : rep.score < -30 ? 'hostile' : 'neutral'
              : null;
            const repColor = rep
              ? rep.score > 30 ? 'green' : rep.score < -30 ? 'red' : 'gray'
              : 'gray';
            return (
              <Box key={npc.id} flexDirection="row" gap={1}>
                <Text
                  color={
                    npc.persona.type === 'raider' ? 'red' :
                    npc.persona.type === 'patrol' ? 'green' :
                    'cyan'
                  }
                >
                  {npc.persona.type === 'raider' ? '⚠️ ' :
                   npc.persona.type === 'patrol' ? '🛡️ ' :
                   '📦 '}
                  {npc.persona.name}
                  <Text color="muted" dimColor> — {npc.persona.type}</Text>
                  {repText && (
                    <Text color={repColor}> ({repText}{rep ? ` ${rep.score > 0 ? '+' : ''}${rep.score}` : ''})</Text>
                  )}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* News ticker */}
      {news && news.length > 0 && (
        <Box marginTop={1} borderStyle="single" borderColor="muted" paddingX={2} paddingY={1} flexDirection="column">
          <Text color="muted" dimColor>📰 Galaxy News:</Text>
          {news.slice(-3).map((item, i) => (
            <Text key={i} color="muted" dimColor>
              • {item.headline}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SectorScreen;
