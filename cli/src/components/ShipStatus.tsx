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
 * Compact ship status panel showing vitals.
 * Always visible during sector navigation.
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
  // Calculate cargo total
  const cargoTotal = cargo.ore + cargo.organics + cargo.equipment;
  
  // Color coding based on thresholds
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

  const getShieldColor = () => {
    if (!maxShield || maxShield === 0) return 'muted';
    const pct = (shield ?? 0) / maxShield;
    if (pct < 25) return 'red';
    if (pct < 75) return 'yellow';
    return 'cyan';
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
      
      {netWorth !== undefined && (
        <>
          <Box paddingY={0} />
          <Text color="cyan" dimColor>
            Net Worth: {netWorth.toLocaleString()} cr
            {'  '}
            <Text color={getRankColor(netWorth)} bold>
              {getRank(netWorth)}
            </Text>
          </Text>
        </>
      )}

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
          <Text color={cargoTotal > maxCargo * 0.8 ? 'yellow' : 'white'}>
            {cargoTotal}/{maxCargo}
          </Text>
        </Box>
        
        <Box width={12}>
          <Text color="muted">Hull:</Text>
          <Text color={getHullColor()} bold>
            {maxHull ? `${hull}/${maxHull}` : `${hull}%`}
          </Text>
        </Box>

        {maxShield !== undefined && maxShield > 0 && (
          <Box width={12}>
            <Text color="muted">Shield:</Text>
            <Text color={getShieldColor()} bold>
              {shield ?? 0}/{maxShield}
            </Text>
          </Box>
        )}
        
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
