import React from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';

export interface MarketScreenProps {
  /** Go back to sector screen. */
  onBack: () => void;
}

// Helper to pad strings for alignment
const left = (str: string, width: number): string => str.padEnd(width);
const right = (str: string, width: number): string => str.padStart(width);

// Column widths
const W = {
  product: 12,
  buying: 8,
  selling: 9,
  stock: 10,
};

/**
 * Market trading screen.
 * Shows commodity prices and allows buying/selling.
 */
export const MarketScreen: React.FC<MarketScreenProps> = ({ onBack }) => {
  // Keyboard shortcuts
  useKeyHandler({
    onEscape: onBack,
    onQ: () => {
      process.exit(0);
    },
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" padding={1} marginBottom={1} alignItems="center">
        <Text variant="info" bold>
          CLASS II PORT - TRADING POST ALPHA
        </Text>
      </Box>
      
      {/* Market prices */}
      <Box flexDirection="column" borderStyle="single" paddingX={2} paddingY={1} marginBottom={1}>
        <Text variant="muted" bold>MARKET PRICES:</Text>
        <Box paddingY={1} />
        
        {/* Header row */}
        <Box flexDirection="row" width={100}>
          <Text bold>{left('Product', W.product)}</Text>
          <Text bold>{right('Buying', W.buying)}</Text>
          <Text bold>{right('Selling', W.selling)}</Text>
          <Text bold>{right('In Stock', W.stock)}</Text>
        </Box>
        
        <Box paddingY={0} />
        
        {/* Ore row */}
        <Box flexDirection="row" width={100}>
          <Text variant="warning">{left('Ore', W.product)}</Text>
          <Text variant="danger">{right('95', W.buying)}</Text>
          <Text variant="success">{right('120', W.selling)}</Text>
          <Text>{right('500', W.stock)}</Text>
        </Box>
        
        {/* Organics row */}
        <Box flexDirection="row" width={100}>
          <Text variant="warning">{left('Organics', W.product)}</Text>
          <Text variant="danger">{right('45', W.buying)}</Text>
          <Text variant="success">{right('60', W.selling)}</Text>
          <Text>{right('1,200', W.stock)}</Text>
        </Box>
        
        {/* Equipment row */}
        <Box flexDirection="row" width={100}>
          <Text variant="warning">{left('Equipment', W.product)}</Text>
          <Text variant="danger">{right('200', W.buying)}</Text>
          <Text variant="success">{right('250', W.selling)}</Text>
          <Text>{right('50', W.stock)}</Text>
        </Box>
      </Box>
      
      {/* Cargo hold */}
      <Box borderStyle="single" paddingX={2} paddingY={1}>
        <Text variant="muted" bold>YOUR CARGO (Merchant Ship):</Text>
        <Box paddingY={1} />
        <Text>Ore:        0 / 100</Text>
        <Text>Organics:   0 / 100</Text>
        <Text>Equipment:  0 / 100</Text>
      </Box>
    </Box>
  );
};

export default MarketScreen;
