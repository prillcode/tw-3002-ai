import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export type CommodityType = 'ore' | 'organics' | 'equipment';

export interface Commodity {
  type: CommodityType;
  label: string;
  buyPrice: number;   // Price to buy FROM port
  sellPrice: number;  // Price to sell TO port
  portStock: number;
  cargoAmount: number;
}

export interface CommoditySelectorProps {
  commodities: Commodity[];
  selectedIndex: number;
  mode: 'buy' | 'sell' | 'browse';
}

/**
 * List of tradeable commodities with prices and selection.
 * Highlights selected commodity and shows trading-relevant info.
 */
export const CommoditySelector: React.FC<CommoditySelectorProps> = ({
  commodities,
  selectedIndex,
  mode
}) => {
  const getPriceColor = (price: number, type: 'buy' | 'sell' | 'browse') => {
    // Simple threshold-based coloring
    if (type === 'buy' || type === 'browse') {
      // Lower is better for buying
      if (price < 100) return 'green';
      if (price > 200) return 'red';
      return 'white';
    } else {
      // Higher is better for selling
      if (price > 100) return 'green';
      if (price < 50) return 'red';
      return 'white';
    }
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width={14}>
          <Text color="cyan" bold>Commodity</Text>
        </Box>
        <Box width={12}>
          <Text color="cyan" bold>
            {mode === 'sell' ? '  Sell→Port' : '  Buy←Port'}
          </Text>
        </Box>
        <Box width={12}>
          <Text color="cyan" bold>
            {mode === 'buy' ? '   Port Stock' : '    You Have'}
          </Text>
        </Box>
      </Box>
      
      {/* Commodities */}
      {commodities.map((commodity, index) => {
        const isSelected = index === selectedIndex;
        
        return (
          <Box 
            key={commodity.type}
            flexDirection="row"
            borderStyle={isSelected ? 'round' : undefined}
            borderColor={isSelected ? 'cyan' : undefined}
            paddingX={isSelected ? 1 : 0}
            marginY={0}
          >
            <Box width={14}>
              <Text 
                color={isSelected ? 'cyan' : 'white'} 
                bold={isSelected}
              >
                {isSelected ? '→ ' : '  '}
                {commodity.label}
              </Text>
            </Box>
            
            <Box width={12}>
              <Text 
                color={getPriceColor(
                  mode === 'buy' ? commodity.buyPrice : commodity.sellPrice,
                  mode
                )}
                bold={isSelected}
              >
                {mode === 'buy' 
                  ? `  ${commodity.buyPrice} cr`
                  : `  ${commodity.sellPrice} cr`
                }
              </Text>
            </Box>
            
            <Box width={12}>
              <Text 
                color="muted"
                bold={isSelected}
              >
                {mode === 'buy'
                  ? `   ${commodity.portStock} u`
                  : `    ${commodity.cargoAmount} u`
                }
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default CommoditySelector;
