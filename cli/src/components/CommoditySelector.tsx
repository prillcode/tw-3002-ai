import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

export type CommodityType = 'ore' | 'organics' | 'equipment';

export interface Commodity {
  type: CommodityType;
  label: string;
  buyPrice: number;
  sellPrice: number;
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
 */
export const CommoditySelector: React.FC<CommoditySelectorProps> = ({
  commodities,
  selectedIndex,
  mode
}) => {
  const getPriceColor = (price: number) => {
    if (price < 80) return 'green';
    if (price > 180) return 'red';
    return 'white';
  };

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box flexDirection="row" marginBottom={1} gap={1}>
        <Box width={16}>
          <Text color="cyan" bold>Item</Text>
        </Box>
        <Box width={12}>
          <Text color="cyan" bold>
            {mode === 'sell' ? '   Sell@' : '    Buy@'}
          </Text>
        </Box>
        <Box width={10}>
          <Text color="cyan" bold>
            {mode === 'buy' ? '     Stock' : '      Have'}
          </Text>
        </Box>
      </Box>
      
      {/* Commodities */}
      {commodities.map((commodity, index) => {
        const isSelected = index === selectedIndex;
        const isBuy = mode === 'buy' || mode === 'browse';
        
        return (
          <Box 
            key={commodity.type}
            flexDirection="row"
            gap={1}
            marginY={0}
            paddingX={isSelected ? 1 : 0}
            paddingY={0}
            borderStyle={isSelected ? 'round' : undefined}
            borderColor={isSelected ? 'cyan' : undefined}
          >
            {/* Selection arrow + Name */}
            <Box width={16}>
              <Text 
                color={isSelected ? 'cyan' : 'white'} 
                bold={isSelected}
              >
                {isSelected ? '▶ ' : '  '}
                {commodity.label}
              </Text>
            </Box>
            
            {/* Price */}
            <Box width={12}>
              <Text 
                color={getPriceColor(isBuy ? commodity.buyPrice : commodity.sellPrice)}
                bold={isSelected}
              >
                {isBuy 
                  ? `  ${commodity.buyPrice} cr`
                  : `  ${commodity.sellPrice} cr`
                }
              </Text>
            </Box>
            
            {/* Stock/Cargo */}
            <Box width={10}>
              <Text 
                color="muted"
                bold={isSelected}
              >
                {mode === 'buy'
                  ? `    ${commodity.portStock} u`
                  : `     ${commodity.cargoAmount} u`
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
