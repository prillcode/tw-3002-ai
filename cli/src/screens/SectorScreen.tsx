import React, { useState, useMemo, useEffect } from 'react';
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

  /** Open help screen. */
  onHelp?: () => void;

  /** Open navigation log. */
  onNavigate?: () => void;

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

  /** Tick stats from last NPC evolution (shown once on login). */
  tickStats?: { npcsProcessed: number; actionsTaken: number; llmCalls: number; llmCacheHits: number; llmCost: number; durationMs: number } | null;

  /** Whether player is idle (no input for 15+ min). */
  isIdle?: boolean;
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
const MAX_VISIBLE_NEIGHBORS = 5;
const MAX_DISPLAY_NPCS = 3;
const MAX_DISPLAY_NEWS = 2;

export const SectorScreen: React.FC<SectorScreenProps> = ({
  onMarket,
  onStarDock,
  onCombat,
  onJumpComplete,
  onBack,
  onHelp,
  onNavigate,
  shipName,
  currentSectorId,
  onUpdateSector,
  shipState,
  onUpdateShip,
  netWorth,
  npcs,
  news,
  tickStats,
  isIdle,
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

  // Scroll offset for neighbor list (keep visible area stable)
  const [scrollOffset, setScrollOffset] = useState(0);

  // Track warp transition
  const [isWarping, setIsWarping] = useState(false);
  const [warpTarget, setWarpTarget] = useState<{id: number, name: string} | null>(null);

  // Track quit confirmation dialog
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Terminal width for responsive layout
  const [termWidth, setTermWidth] = useState(process.stdout.columns ?? 120);
  useEffect(() => {
    const handler = () => setTermWidth(process.stdout.columns ?? 120);
    process.stdout.on('resize', handler);
    return () => { process.stdout.off('resize', handler); };
  }, []);
  const wideLayout = termWidth >= 100; // ShipStatus(30) + SectorList(30) + SectorMap(~40)

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
      setSelectedIndex(prev => {
        const next = prev > 0 ? prev - 1 : prev;
        setScrollOffset(so => Math.min(so, next));
        return next;
      });
    },
    onDown: () => {
      setSelectedIndex(prev => {
        const next = prev < neighbors.length - 1 ? prev + 1 : prev;
        if (next >= scrollOffset + MAX_VISIBLE_NEIGHBORS) {
          setScrollOffset(next - MAX_VISIBLE_NEIGHBORS + 1);
        }
        return next;
      });
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
    onH: () => {
      onHelp?.();
    },
    onN: () => {
      onNavigate?.();
    },
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

  // Visible neighbor slice (stable height)
  const visibleNeighbors = neighbors.slice(scrollOffset, scrollOffset + MAX_VISIBLE_NEIGHBORS);
  const showScrollUp = scrollOffset > 0;
  const showScrollDown = scrollOffset + MAX_VISIBLE_NEIGHBORS < neighbors.length;

  // Build a single-line status message (compact, always same height)
  const statusMessages: string[] = [];
  if (shipState.turns === 0) statusMessages.push('OUT OF TURNS');
  else if (shipState.turns <= 20) statusMessages.push(`LOW TURNS: ${shipState.turns}`);
  if (isIdle) statusMessages.push('IDLE');
  if (isStarDock) statusMessages.push('STARDOCK');

  const displayNpcs = (npcs ?? []).slice(0, MAX_DISPLAY_NPCS);
  const extraNpcCount = (npcs ?? []).length - MAX_DISPLAY_NPCS;
  const displayNews = (news ?? []).slice(-MAX_DISPLAY_NEWS);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Sector Info Header */}
      <SectorInfo sector={currentSector} isStarDock={isStarDock} />

      <Box paddingY={1} />

      {/* Main content area: ShipStatus | SectorList | SectorMap */}
      {wideLayout ? (
        <Box flexDirection="row" justifyContent="space-between" gap={1}>
          {/* Left: Ship Status (fixed width, same as SectorList) */}
          <Box flexDirection="column" minWidth={30}>
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

          {/* Middle: Sector List (fixed width) */}
          <Box flexDirection="column" minWidth={30}>
            {showScrollUp && (
              <Text color="muted" dimColor> ▲ {scrollOffset} more</Text>
            )}
            <SectorList
              sectors={visibleNeighbors}
              selectedIndex={selectedIndex - scrollOffset}
              stardockIds={galaxy.stardocks}
            />
            {showScrollDown && (
              <Text color="muted" dimColor> ▼ {neighbors.length - scrollOffset - MAX_VISIBLE_NEIGHBORS} more</Text>
            )}
          </Box>

          {/* Right: Sector Map (fills remaining width) */}
          <Box flexDirection="column" flexGrow={1}>
            <SectorMap
              currentSector={currentSector}
              neighbors={neighbors}
              selectedIndex={selectedIndex}
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          {/* Top row: ShipStatus | SectorList */}
          <Box flexDirection="row" justifyContent="space-between" gap={1}>
            <Box flexDirection="column" minWidth={30}>
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
            <Box flexDirection="column" minWidth={30}>
              {showScrollUp && (
                <Text color="muted" dimColor> ▲ {scrollOffset} more</Text>
              )}
              <SectorList
                sectors={visibleNeighbors}
                selectedIndex={selectedIndex - scrollOffset}
                stardockIds={galaxy.stardocks}
              />
              {showScrollDown && (
                <Text color="muted" dimColor> ▼ {neighbors.length - scrollOffset - MAX_VISIBLE_NEIGHBORS} more</Text>
              )}
            </Box>
          </Box>

          {/* Below: Sector Map (full width) */}
          <Box marginTop={1} flexGrow={1}>
            <SectorMap
              currentSector={currentSector}
              neighbors={neighbors}
              selectedIndex={selectedIndex}
            />
          </Box>
        </Box>
      )}

      <Box paddingY={1} />

      {/* Jump preview / status message */}
      <Box
        borderStyle="single"
        borderColor={selectedSector ? 'green' : 'muted'}
        paddingX={2}
        paddingY={0}
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
            <Text color="green"> — [Enter] Jump (1 turn)</Text>
          </Text>
        ) : (
          <Text color="muted">No warp lanes available</Text>
        )}
      </Box>

      {/* Compact status line (always rendered, prevents layout jumps) */}
      <Box marginTop={0} paddingY={0} alignItems="center">
        {statusMessages.length > 0 ? (
          <Text>
            {statusMessages.map((msg, i) => (
              <Text key={i} color={msg.includes('OUT') ? 'red' : msg.includes('LOW') ? 'yellow' : msg.includes('IDLE') ? 'red' : 'magenta'} bold>
                {i > 0 && ' · '}
                {msg.includes('STARDOCK') ? '⚡ StarDock [D]' : msg.includes('OUT') ? `⚠ ${msg}` : msg.includes('LOW') ? `⚠ ${msg}` : `💤 ${msg}`}
              </Text>
            ))}
          </Text>
        ) : (
          <Text color="muted" dimColor> </Text>
        )}
      </Box>

      {/* Tick stats (compact, always same height when present) */}
      {tickStats && (
        <Box marginTop={0} borderStyle="single" borderColor="cyan" paddingX={1} paddingY={0} flexDirection="column">
          <Text color="cyan">
            🌌 {tickStats.npcsProcessed > 0
              ? `${tickStats.npcsProcessed} NPCs acted (${tickStats.actionsTaken} actions)`
              : 'Galaxy quiet'}
            {tickStats.llmCalls > 0 && <Text color="yellow"> · {tickStats.llmCalls} LLM</Text>}
            {tickStats.llmCacheHits > 0 && <Text color="green"> · {tickStats.llmCacheHits} cached</Text>}
            {(tickStats.llmCalls > 0 || tickStats.llmCacheHits > 0) && <Text color="muted"> · ${tickStats.llmCost.toFixed(4)}</Text>}
          </Text>
        </Box>
      )}

      {/* NPCs present (capped, stable height) */}
      <Box marginTop={0} flexDirection="column">
        {displayNpcs.map(npc => {
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
        {extraNpcCount > 0 && (
          <Text color="muted" dimColor>
            … and {extraNpcCount} more
          </Text>
        )}
      </Box>

      {/* News ticker (capped, compact) */}
      {displayNews.length > 0 && (
        <Box marginTop={0} borderStyle="single" borderColor="muted" paddingX={1} paddingY={0} flexDirection="column">
          {displayNews.map((item, i) => (
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
