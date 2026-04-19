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
  
  return (
    <Box flexDirection="column">
      {/* Quantity adjuster */}
      <Box flexDirection="row" alignItems="center" gap={2}>
        <Text color="muted">Quantity:</Text>
        <Box 
          borderStyle="round" 
          borderColor={quantity >= min && quantity <= max ? 'cyan' : 'red'}
          paddingX={2}
          paddingY={0}
        >
          <Text color="white" bold>{quantity}</Text>
        </Box>
        <Text color="muted">/ {max}</Text>
      </Box>
      
      <Box paddingY={1} />
      
      {/* Price breakdown */}
      <Box flexDirection="column" gap={0}>
        <Box flexDirection="row" gap={1}>
          <Text color="muted">Unit Price:</Text>
          <Text>{unitPrice} cr</Text>
        </Box>
        
        <Box flexDirection="row" gap={1}>
          <Text color="muted">Total:</Text>
          <Text color={mode === 'buy' ? 'red' : 'green'} bold>
            {total.toLocaleString()} cr
          </Text>
        </Box>
        
        {mode === 'buy' && remainingCredits !== undefined && (
          <Box flexDirection="row" gap={1}>
            <Text color="muted">Remaining:</Text>
            <Text color={canAfford ? 'white' : 'red'}>
              {remainingCredits.toLocaleString()} cr
            </Text>
          </Box>
        )}
      </Box>
      
      {/* Error messages */}
      {quantity > max && (
        <Box marginTop={1}>
          <Text color="red">Max quantity: {max}</Text>
        </Box>
      )}
      
      {quantity < min && (
        <Box marginTop={1}>
          <Text color="red">Min quantity: {min}</Text>
        </Box>
      )}
      
      {!canAfford && (
        <Box marginTop={1}>
          <Text color="red">Not enough credits!</Text>
        </Box>
      )}
    </Box>
  );
};

export default QuantitySelector;
