import React, { useState } from 'react';
import { Box, Text, CargoDisplay, CommoditySelector, QuantitySelector, ConfirmDialog } from '../components';
import { useKeyHandler } from '../hooks';
import { getSector, getMarketData, type CommodityType } from '../data/mockGalaxy';

export interface ShipState {
  name: string;
  credits: number;
  cargo: {
    ore: number;
    organics: number;
    equipment: number;
  };
  maxCargo: number;
}

export interface MarketScreenProps {
  /** Go back to sector screen. */
  onBack: () => void;
  
  /** Current sector ID for port lookup. */
  currentSectorId: number;
  
  /** Ship state for trading. */
  shipState: ShipState;
  
  /** Update ship state after trade. */
  onUpdateShip: (newState: ShipState) => void;
}

type TradeMode = 'browse' | 'buy' | 'sell';

/**
 * Market trading screen with buy/sell functionality.
 * 
 * Modes:
 * - browse: View prices, select commodity
 * - buy: Set quantity, confirm purchase
 * - sell: Set quantity, confirm sale
 */
export const MarketScreen: React.FC<MarketScreenProps> = ({ 
  onBack,
  currentSectorId,
  shipState,
  onUpdateShip
}) => {
  const sector = getSector(currentSectorId);
  const port = sector?.port;
  
  // Get market data for this port
  const marketData = port ? getMarketData(port) : [];
  
  // Track state
  const [mode, setMode] = useState<TradeMode>('browse');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  
  const currentCommodity = marketData[selectedIndex];
  const currentCargo = shipState.cargo[currentCommodity?.commodity as CommodityType] || 0;
  const cargoTotal = shipState.cargo.ore + shipState.cargo.organics + shipState.cargo.equipment;
  const cargoFree = shipState.maxCargo - cargoTotal;
  
  // Calculate limits
  const buyMax = Math.min(
    cargoFree,
    Math.floor(shipState.credits / (currentCommodity?.buyPrice || 1)),
    currentCommodity?.portStock || 0
  );
  const sellMax = currentCargo;
  
  // Calculate totals
  const buyTotal = (currentCommodity?.buyPrice || 0) * quantity;
  const sellTotal = (currentCommodity?.sellPrice || 0) * quantity;
  
  // Handle buy
  const handleBuy = () => {
    if (!currentCommodity || quantity <= 0) return;
    
    const total = currentCommodity.buyPrice * quantity;
    
    // Validations
    if (quantity > cargoFree) {
      setMessage('Not enough cargo space!');
      return;
    }
    if (total > shipState.credits) {
      setMessage('Insufficient credits!');
      return;
    }
    if (quantity > currentCommodity.portStock) {
      setMessage('Port does not have enough stock!');
      return;
    }
    
    // Execute trade
    const newCargo = { ...shipState.cargo };
    newCargo[currentCommodity.commodity] += quantity;
    
    onUpdateShip({
      ...shipState,
      credits: shipState.credits - total,
      cargo: newCargo
    });
    
    setMessage(`Bought ${quantity} ${currentCommodity.label} for ${total} credits`);
    setMode('browse');
    setQuantity(1);
  };
  
  // Handle sell
  const handleSell = () => {
    if (!currentCommodity || quantity <= 0) return;
    
    const total = currentCommodity.sellPrice * quantity;
    
    // Validation
    if (quantity > currentCargo) {
      setMessage(`You don't have that much ${currentCommodity.label}!`);
      return;
    }
    
    // Execute trade
    const newCargo = { ...shipState.cargo };
    newCargo[currentCommodity.commodity] -= quantity;
    
    onUpdateShip({
      ...shipState,
      credits: shipState.credits + total,
      cargo: newCargo
    });
    
    setMessage(`Sold ${quantity} ${currentCommodity.label} for ${total} credits`);
    setMode('browse');
    setQuantity(1);
  };
  
  // Keyboard handling
  useKeyHandler({
    onUp: () => {
      if (mode === 'browse') {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        setMessage(null);
      } else {
        setQuantity(prev => Math.max(1, prev - 1));
      }
    },
    onDown: () => {
      if (mode === 'browse') {
        setSelectedIndex(prev => (prev < marketData.length - 1 ? prev + 1 : prev));
        setMessage(null);
      } else {
        const max = mode === 'buy' ? buyMax : sellMax;
        setQuantity(prev => Math.min(max, prev + 1));
      }
    },
    onLeft: () => {
      if (mode === 'buy' || mode === 'sell') {
        setQuantity(prev => Math.max(1, prev - 1));
      }
    },
    onRight: () => {
      if (mode === 'buy' || mode === 'sell') {
        const max = mode === 'buy' ? buyMax : sellMax;
        setQuantity(prev => Math.min(max, prev + 1));
      }
    },
    onReturn: () => {
      if (mode === 'browse') {
        // Enter doesn't do anything in browse, need to hit B or S
        setMessage('Press [B] to Buy or [S] to Sell');
      } else if (mode === 'buy') {
        handleBuy();
      } else if (mode === 'sell') {
        handleSell();
      }
    },
    onB: () => {
      if (mode === 'browse') {
        if (buyMax > 0) {
          setMode('buy');
          setQuantity(1);
          setMessage(null);
        } else {
          setMessage('Cannot buy: no cargo space or funds');
        }
      }
    },
    onS: () => {
      if (mode === 'browse') {
        if (sellMax > 0) {
          setMode('sell');
          setQuantity(1);
          setMessage(null);
        } else {
          setMessage('Cannot sell: no cargo to sell');
        }
      }
    },
    onEscape: () => {
      if (mode !== 'browse') {
        setMode('browse');
        setQuantity(1);
        setMessage(null);
      } else {
        onBack();
      }
    },
    onQ: () => {
      setShowQuitConfirm(true);
    },
  });
  
  // No port = no market
  if (!port || marketData.length === 0) {
    return (
      <Box flexDirection="column" padding={2} alignItems="center">
        <Box borderStyle="round" borderColor="red" padding={2}>
          <Text color="red" bold>
            NO PORT IN THIS SECTOR
          </Text>
          <Box paddingY={1} />
          <Text color="muted">
            There is no trading post here.
          </Text>
          <Text color="muted">
            Navigate to a sector with a port to trade.
          </Text>
        </Box>
        <Box paddingY={2} />
        <Text color="muted" dimColor>
          [Esc] Return to Sector
        </Text>
      </Box>
    );
  }
  
  // Quit confirmation
  if (showQuitConfirm) {
    return (
      <ConfirmDialog
        message="Quit the game and return to shell?"
        onConfirm={() => process.exit(0)}
        onCancel={() => setShowQuitConfirm(false)}
      />
    );
  }
  
  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="cyan" bold>
            {`CLASS ${port.class} PORT — ${port.type.toUpperCase()} ${port.buying ? 'BUYER' : 'SELLER'}`}
          </Text>
          <Text color="yellow">
            Credits: {shipState.credits.toLocaleString()}
          </Text>
        </Box>
      </Box>
      
      {/* Main content */}
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        {/* Left: Commodity selector */}
        <Box flexDirection="column" width={40}>
          <Box marginBottom={1}>
            <Text color="cyan" bold>
              {mode === 'buy' ? '🛒 BUYING MODE' : mode === 'sell' ? '💰 SELLING MODE' : '📊 MARKET PRICES'}
            </Text>
          </Box>
          
          <CommoditySelector
            commodities={marketData.map(m => ({
              type: m.commodity,
              label: m.label,
              buyPrice: m.buyPrice,
              sellPrice: m.sellPrice,
              portStock: m.portStock,
              cargoAmount: shipState.cargo[m.commodity]
            }))}
            selectedIndex={selectedIndex}
            mode={mode}
          />
        </Box>
        
        {/* Right: Transaction panel */}
        <Box flexDirection="column" width={35}>
          {mode !== 'browse' && currentCommodity && (
            <Box 
              borderStyle="round" 
              borderColor={mode === 'buy' ? 'red' : 'green'}
              padding={1}
              marginBottom={1}
            >
              <Text color={mode === 'buy' ? 'red' : 'green'} bold>
                {mode === 'buy' ? '🛒 PURCHASE ORDER' : '💰 SALE ORDER'}
              </Text>
              
              <Box paddingY={1} />
              
              <Text>
                {currentCommodity.label} @ {mode === 'buy' ? currentCommodity.buyPrice : currentCommodity.sellPrice} cr/unit
              </Text>
              
              <Box paddingY={1} />
              
              <QuantitySelector
                quantity={quantity}
                min={1}
                max={mode === 'buy' ? buyMax : sellMax}
                unitPrice={mode === 'buy' ? currentCommodity.buyPrice : currentCommodity.sellPrice}
                total={mode === 'buy' ? buyTotal : sellTotal}
                remainingCredits={mode === 'buy' ? shipState.credits - buyTotal : undefined}
                mode={mode}
              />
            </Box>
          )}
          
          {mode === 'browse' && (
            <Box borderStyle="single" borderColor="muted" padding={1}>
              <Text color="muted" dimColor>
                Select a commodity and press:
              </Text>
              <Box paddingY={0} />
              <Text color="green">
                [B] Buy from Port
              </Text>
              <Text color="red">
                [S] Sell to Port
              </Text>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Cargo display */}
      <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <CargoDisplay cargo={shipState.cargo} maxCargo={shipState.maxCargo} />
      </Box>
      
      {/* Message / status bar */}
      {message && (
        <Box 
          borderStyle="round" 
          borderColor={message.includes('!') ? 'red' : 'green'}
          padding={1}
          marginBottom={1}
          alignItems="center"
        >
          <Text color={message.includes('!') ? 'red' : 'green'} bold>
            {message}
          </Text>
        </Box>
      )}
      
      {/* Help bar */}
      <Box flexDirection="row" justifyContent="center">
        <Text color="muted" dimColor>
          {mode === 'browse' 
            ? '[↑↓] Select  [B] Buy  [S] Sell  [Esc] Back  [Q] Quit'
            : '[↑↓] Adjust Qty  [Enter] Confirm  [Esc] Cancel'
          }
        </Text>
      </Box>
    </Box>
  );
};

export default MarketScreen;
