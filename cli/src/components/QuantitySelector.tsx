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
  const withinLimits = quantity >= min && quantity <= max;
  
  return (
    <Box flexDirection="column">
      {/* Quantity adjuster */}
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Text color="muted">Qty:</Text>
        <Box 
          borderStyle="round" 
          borderColor={withinLimits ? 'cyan' : 'red'}
          paddingX={2}
          paddingY={0}
        >
          <Text color="white" bold>{quantity}</Text>
        </Box>
        <Text color="muted">/ {max} max</Text>
      </Box>
      
      <Box paddingY={0} />
      
      {/* Price breakdown */}
      <Box flexDirection="row" gap={1}>
        <Text color="muted">Unit:</Text>
        <Text>{unitPrice} cr</Text>
      </Box>
      
      <Box flexDirection="row" gap={1}>
        <Text color="muted">Total:</Text>
        <Text color={mode === 'buy' ? 'red' : 'green'} bold>
          {total.toLocaleString()} cr
        </Text>
      </Box>
      
      {/* Remaining credits (buy mode only) */}
      {remainingCredits !== undefined && (
        <Box flexDirection="row" gap={1}>
          <Text color="muted">After:</Text>
          <Text color={canAfford ? 'white' : 'red'}>
            {remainingCredits.toLocaleString()} cr
          </Text>
        </Box>
      )}
      
      {/* Error messages */}
      {!withinLimits && (
        <Box marginTop={0}>
          <Text color="red">
            Quantity must be between {min} and {max}
          </Text>
        </Box>
      )}
      
      {!canAfford && (
        <Box marginTop={0}>
          <Text color="red">Not enough credits!</Text>
        </Box>
      )}
    </Box>
  );
};

export default QuantitySelector;
