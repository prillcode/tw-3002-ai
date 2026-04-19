import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface QuantitySelectorProps {
  quantity: number;
  min: number;
  max: number;
  unitPrice: number;
  total: number;
  remainingCredits?: number;
  mode: 'buy' | 'sell';
}

/**
 * Quantity adjustment and transaction summary display.
 * Shows current quantity, limits, and cost/profit.
 */
export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  min,
  max,
  unitPrice,
  total,
  remainingCredits,
  mode
}) => {
  const canAfford = remainingCredits === undefined || remainingCredits >= 0;
  const canFit = quantity <= max;
  
  return (
    <Box flexDirection="column" alignItems="center">
      <Box flexDirection="row" alignItems="center" gap={2}>
        <Text color="muted">Quantity:</Text>
        
        <Box 
          borderStyle="round" 
          borderColor={canFit ? 'cyan' : 'red'}
          paddingX={2}
          paddingY={0}
        >
          <Text color="white" bold>
            {quantity}
          </Text>
        </Box>
        
        <Text color="muted">units</Text>
      </Box>
      
      <Box paddingY={0} />
      
      <Text color="muted" dimColor>
        [← → or ↑↓] Adjust  [Min: {min}] [Max: {max}]
      </Text>
      
      <Box paddingY={1} />
      
      <Box flexDirection="row" gap={1}>
        <Text color="muted">{mode === 'buy' ? 'Total Cost:' : 'Total Value:'}</Text>
        <Text color={mode === 'buy' ? 'red' : 'green'} bold>
          {total.toLocaleString()} credits
        </Text>
      </Box>
      
      {remainingCredits !== undefined && (
        <Box marginTop={0}>
          <Text color={canAfford ? 'muted' : 'red'} dimColor={canAfford}>
            {canAfford 
              ? `After: ${remainingCredits.toLocaleString()} credits`
              : 'Insufficient credits!'
            }
          </Text>
        </Box>
      )}
      
      {!canFit && (
        <Box marginTop={0}>
          <Text color="red">
            Not enough {mode === 'buy' ? 'cargo space' : 'cargo to sell'}!
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default QuantitySelector;
