import React from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';
import type { Galaxy } from '@tw3002/engine';

export interface NavigationScreenProps {
  galaxy: Galaxy;
  visitedIds: number[];
  currentSectorId: number;
  startingSectorId: number;
  onBack: () => void;
}

function getDangerIcon(danger: string): string {
  switch (danger) {
    case 'safe': return '●';
    case 'caution': return '◐';
    case 'dangerous': return '◉';
    default: return '○';
  }
}

function getDangerColor(danger: string): string {
  switch (danger) {
    case 'safe': return 'green';
    case 'caution': return 'yellow';
    case 'dangerous': return 'red';
    default: return 'gray';
  }
}

interface NavSegment {
  type: 'visited' | 'blast';
  ids: number[];
}

/**
 * Navigation log showing every sector visited this session.
 * Handles ship destruction as a blast separator — new history
 * starts from the respawn point.
 */
export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  galaxy,
  visitedIds,
  currentSectorId,
  startingSectorId,
  onBack,
}) => {
  useKeyHandler({
    onEscape: onBack,
    onN: onBack,
  });

  // Split history into segments separated by blast markers (-1)
  const segments: NavSegment[] = [];
  let current: number[] = [];
  let blastCount = 0;
  for (const id of visitedIds) {
    if (id === -1) {
      if (current.length > 0) {
        segments.push({ type: 'visited', ids: current });
        current = [];
      }
      segments.push({ type: 'blast', ids: [] });
      blastCount++;
    } else {
      current.push(id);
    }
  }
  if (current.length > 0) {
    segments.push({ type: 'visited', ids: current });
  }

  // Active segment is the last one
  const activeSegment = segments.length > 0 ? segments[segments.length - 1] : null;
  const activeVisited = activeSegment?.type === 'visited' ? activeSegment.ids : [];

  // Deduplicate active visited while preserving order
  const seen = new Set<number>();
  const uniqueActive: number[] = [];
  for (const id of activeVisited) {
    if (!seen.has(id)) {
      seen.add(id);
      uniqueActive.push(id);
    }
  }

  // Breadcrumb from active segment only (last 8 hops)
  const breadcrumb = activeVisited.slice(-8);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1} flexDirection="column">
        <Text color="cyan" bold>
          🧭 NAVIGATION LOG
        </Text>
        <Text color="muted" dimColor>
          {uniqueActive.length} sector{uniqueActive.length !== 1 ? 's' : ''} visited
          {blastCount > 0 && ` · ${blastCount} ship${blastCount > 1 ? 's' : ''} lost`}
        </Text>
      </Box>

      <Box paddingY={1} />

      {/* Breadcrumb trail (active segment only) */}
      <Box borderStyle="single" borderColor="yellow" paddingX={2} paddingY={1} flexDirection="column">
        <Text color="yellow" bold>
          Flight Path
        </Text>
        <Box paddingY={0} />
        <Box flexDirection="row" flexWrap="wrap">
          {breadcrumb.map((id, i) => {
            const sector = galaxy.sectors.get(id);
            const isCurrent = id === currentSectorId;
            const isStart = id === startingSectorId;

            return (
              <Box key={`${id}-${i}`} flexDirection="row">
                {i > 0 && (
                  <Text color="muted" dimColor>{' → '}</Text>
                )}
                <Text
                  color={isCurrent ? 'yellow' : isStart ? 'green' : 'white'}
                  bold={isCurrent}
                >
                  {isStart && '🏠'}
                  {isCurrent && '★'}
                  {!isStart && !isCurrent && ' '}
                  {id}
                </Text>
                {sector?.port && (
                  <Text color="yellow" dimColor>P</Text>
                )}
              </Box>
            );
          })}
        </Box>
        <Box paddingY={0} />
        <Text color="muted" dimColor>
          🏠 = start · ★ = you · P = port
        </Text>
      </Box>

      <Box paddingY={1} />

      {/* Visited sectors — render segments with blast separators */}
      <Box borderStyle="single" borderColor="cyan" paddingX={1} paddingY={1} flexDirection="column">
        <Text color="cyan" bold>
          Sectors Visited
        </Text>
        <Box paddingY={0} />
        {segments.map((segment, segIdx) => {
          if (segment.type === 'blast') {
            return (
              <Box key={`blast-${segIdx}`} flexDirection="row" justifyContent="center" marginY={1}>
                <Text color="red" bold>
                  💥 SHIP DESTROYED 💥
                </Text>
              </Box>
            );
          }

          const segSeen = new Set<number>();
          return segment.ids.map((id, i) => {
            if (segSeen.has(id)) return null;
            segSeen.add(id);

            const sector = galaxy.sectors.get(id);
            if (!sector) return null;

            const isCurrent = id === currentSectorId;
            const isStart = id === startingSectorId && segIdx === segments.length - 1;
            const isNeighbor = galaxy.connections.some(
              c => (c.from === currentSectorId && c.to === id) || (c.to === currentSectorId && c.from === id)
            );

            return (
              <Box key={`${segIdx}-${id}`} flexDirection="row" gap={1}>
                <Text color={isCurrent ? 'yellow' : isStart ? 'green' : 'white'} bold={isCurrent}>
                  {isStart ? '🏠' : isCurrent ? '★' : ' '}
                  [{id}]
                </Text>
                <Box width={16}>
                  <Text color={isCurrent ? 'yellow' : 'white'} bold={isCurrent}>
                    {sector.name}
                  </Text>
                </Box>
                <Box width={2}>
                  <Text color={getDangerColor(sector.danger)}>
                    {getDangerIcon(sector.danger)}
                  </Text>
                </Box>
                {sector.port && (
                  <Text color="yellow" dimColor>
                    Port {sector.port.class}
                  </Text>
                )}
                {isNeighbor && !isCurrent && (
                  <Text color="green" dimColor>
                    ← adjacent
                  </Text>
                )}
              </Box>
            );
          });
        })}
      </Box>

      <Box paddingY={1} />

      {/* Return hint */}
      <Box alignItems="center">
        <Text color="muted" dimColor>
          [N] or [Esc] Return to Sector
        </Text>
      </Box>
    </Box>
  );
};

export default NavigationScreen;
