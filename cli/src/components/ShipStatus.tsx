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
  };
  maxCargo: number;
  hull: number;
  maxHull?: number;
  shield?: number;
  maxShield?: number;
  turns: number;
  maxTurns: number;
  currentSector: number;
  netWorth?: number;
}

/**
 * Compact vertical ship status panel.
 * Stacked layout for narrow terminals; responsive parent handles positioning.
 */
export const ShipStatus: React.FC<ShipStatusProps> = ({
  shipName,
  credits,
  cargo,
  maxCargo,
  hull,
  maxHull,
  shield,
  maxShield,
  turns,
  maxTurns,
  currentSector,
  netWorth,
}) => {
  const cargoTotal = cargo.ore + cargo.organics + cargo.equipment;

  const getCreditsColor = () => {
    if (credits < 100) return 'red';
    if (credits < 1000) return 'yellow';
    return 'green';
  };

  const getRank = (worth: number) => {
    if (worth < 10000) return 'Space Peasant';
    if (worth < 50000) return 'Trader';
    if (worth < 100000) return 'Merchant Prince';
    return 'Galactic Tycoon';
  };

  const getRankColor = (worth: number) => {
    if (worth < 10000) return 'muted';
    if (worth < 50000) return 'yellow';
    if (worth < 100000) return 'magenta';
    return 'green';
  };

  const getHullColor = () => {
    const pct = maxHull ? (hull / maxHull) * 100 : hull;
    if (pct < 25) return 'red';
    if (pct < 75) return 'yellow';
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
      minWidth={30}
    >
      {/* Ship name */}
      <Text color="cyan" bold>
        {`⚡ ${shipName}`}
      </Text>

      {/* Net worth + rank */}
      {netWorth !== undefined && (
        <>
          <Text color="cyan" dimColor>
            {netWorth.toLocaleString()} cr
          </Text>
          <Text color={getRankColor(netWorth)} bold>
            {getRank(netWorth)}
          </Text>
        </>
      )}

      <Box paddingY={0} />

      {/* Credits — right-aligned value */}
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="muted">Credits</Text>
        <Text color={getCreditsColor()} bold>
          {credits.toLocaleString()}
        </Text>
      </Box>

      {/* Cargo | Hull on one line */}
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="muted">
          Cargo <Text color={cargoTotal > maxCargo * 0.8 ? 'yellow' : 'white'}>{cargoTotal}/{maxCargo}</Text>
        </Text>
        <Text color="muted">
          Hull <Text color={getHullColor()} bold>{maxHull ? `${Math.round(hull)}/${maxHull}` : `${Math.round(hull)}%`}</Text>
        </Text>
      </Box>

      {/* Shield (if any) */}
      {maxShield !== undefined && maxShield > 0 && (
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="muted">Shield</Text>
          <Text color="cyan" bold>
            {Math.round(shield ?? 0)}/{maxShield}
          </Text>
        </Box>
      )}

      <Box paddingY={0} />

      {/* Turns */}
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="muted">Turns</Text>
        <Text color={getTurnsColor()}>
          {turns}/{maxTurns}
        </Text>
      </Box>

      {/* Location */}
      <Box flexDirection="row" justifyContent="space-between">
        <Text color="muted">Location</Text>
        <Text color="white">Sector {currentSector}</Text>
      </Box>
    </Box>
  );
};

export default ShipStatus;
