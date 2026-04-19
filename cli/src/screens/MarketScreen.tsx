import React from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';

export interface MarketScreenProps {
  /** Go back to sector screen. */
  onBack: () => void;
}

/**
 * Market trading screen.
 * Shows commodity prices and allows buying/selling.
 */
export const MarketScreen: React.FC<MarketScreenProps> = ({ onBack }) => {
  // Keyboard shortcuts
  useKeyHandler({
    onEscape: onBack,
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Text variant="info" bold>
          CLASS II PORT - TRADING POST ALPHA
        </Text>
      </Box>
      
      {/* Market prices */}
      <Box flexDirection="column" borderStyle="single" padding={1} marginBottom={1}>
        <Text variant="muted" bold>MARKET PRICES:</Text>
        <Box padding={1} />
        
        <Box flexDirection="row" justifyContent="space-between">
          <Text>Product</Text>
          <Text>Buying</Text>
          <Text>Selling</Text>
          <Text>In Stock</Text>
        </Box>
        
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="warning">Ore</Text>
          <Text variant="danger">95</Text>
          <Text variant="success">120</Text>
          <Text>500</Text>
        </Box>
        
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="warning">Organics</Text>
          <Text variant="danger">45</Text>
          <Text variant="success">60</Text>
          <Text>1,200</Text>
        </Box>
        
        <Box flexDirection="row" justifyContent="space-between">
          <Text variant="warning">Equipment</Text>
          <Text variant="danger">200</Text>
          <Text variant="success">250</Text>
          <Text>50</Text>
        </Box>
      </Box>
      
      {/* Cargo hold */}
      <Box borderStyle="single" padding={1}>
        <Text variant="muted" bold>YOUR CARGO (Merchant Ship):</Text>
        <Box padding={1} />
        <Text>Ore: 0 / 100</Text>
        <Text>Organics: 0 / 100</Text>
        <Text>Equipment: 0 / 100</Text>
      </Box>
    </Box>
  );
};

export default MarketScreen;
