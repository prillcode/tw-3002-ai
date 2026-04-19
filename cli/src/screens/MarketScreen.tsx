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
  onBack: () => void;
  currentSectorId: number;
  shipState: ShipState;
  onUpdateShip: (newState: ShipState) => void;
}

type TradeMode = 'browse' | 'buy' | 'sell';

export const MarketScreen: React.FC<MarketScreenProps> = ({ 
  onBack,
  currentSectorId,
  shipState,
  onUpdateShip
}) => {
  const sector = getSector(currentSectorId);
  const port = sector?.port;
  const marketData = port ? getMarketData(port) : [];
  
  const [mode, setMode] = useState<TradeMode>('browse');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);
  
  const currentCommodity = marketData[selectedIndex];
  const currentCargo = shipState.cargo[currentCommodity?.commodity as CommodityType] || 0;
  const cargoTotal = shipState.cargo.ore + shipState.cargo.organics + shipState.cargo.equipment;
  const cargoFree = shipState.maxCargo - cargoTotal;
  
  const buyMax = Math.min(
    cargoFree,
    Math.floor(shipState.credits / (currentCommodity?.buyPrice || 1)),
    currentCommodity?.portStock || 0
  );
  const sellMax = currentCargo;
  
  const buyTotal = (currentCommodity?.buyPrice || 0) * quantity;
  const sellTotal = (currentCommodity?.sellPrice || 0) * quantity;
  
  const handleBuy = () => {
    if (!currentCommodity || quantity <= 0) return;
    const total = currentCommodity.buyPrice * quantity;
    
    if (quantity > cargoFree) {
      setMessage('Not enough cargo space!');
      return;
    }
    if (total > shipState.credits) {
      setMessage('Insufficient credits!');
      return;
    }
    
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
  
  const handleSell = () => {
    if (!currentCommodity || quantity <= 0) return;
    const total = currentCommodity.sellPrice * quantity;
    
    if (quantity > currentCargo) {
      setMessage(`You don't have that much ${currentCommodity.label}!`);
      return;
    }
    
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
  
  useKeyHandler({
    onUp: () => {
      if (mode === 'browse') {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        setMessage(null);
      } else {
        // In buy/sell mode: UP increases quantity
        const max = mode === 'buy' ? buyMax : sellMax;
        setQuantity(prev => Math.min(max, prev + 1));
      }
    },
    onDown: () => {
      if (mode === 'browse') {
        setSelectedIndex(prev => (prev < marketData.length - 1 ? prev + 1 : prev));
        setMessage(null);
      } else {
        // In buy/sell mode: DOWN decreases quantity
        setQuantity(prev => Math.max(1, prev - 1));
      }
    },
    onLeft: () => {
      if (mode !== 'browse') {
        // LEFT decreases quantity (alternative to DOWN)
        setQuantity(prev => Math.max(1, prev - 1));
      }
    },
    onRight: () => {
      if (mode !== 'browse') {
        // RIGHT increases quantity (alternative to UP)
        const max = mode === 'buy' ? buyMax : sellMax;
        setQuantity(prev => Math.min(max, prev + 1));
      }
    },
    onReturn: () => {
      if (showTradeConfirm) {
        // Execute the trade
        if (mode === 'buy') {
          handleBuy();
        } else if (mode === 'sell') {
          handleSell();
        }
        setShowTradeConfirm(false);
      } else if (mode === 'browse') {
        setMessage('Press [B] to Buy or [S] to Sell');
      } else if (mode === 'buy' || mode === 'sell') {
        // Show confirmation instead of immediate execution
        setShowTradeConfirm(true);
      }
    },
    onB: () => {
      if (mode === 'browse') {
        if (buyMax > 0) {
          setMode('buy');
          setQuantity(1);
          setMessage(null);
        } else {
          setMessage('Cannot buy: check cargo space, credits, or port stock');
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
      if (showTradeConfirm) {
        // Cancel trade confirmation
        setShowTradeConfirm(false);
      } else if (mode !== 'browse') {
        setMode('browse');
        setQuantity(1);
        setMessage(null);
      } else {
        onBack();
      }
    },
    onQ: () => setShowQuitConfirm(true),
  });
  
  if (!port || marketData.length === 0) {
    return (
      <Box flexDirection="column" padding={2} alignItems="center">
        <Box borderStyle="round" borderColor="red" padding={2}>
          <Text color="red" bold>NO PORT IN THIS SECTOR</Text>
          <Box paddingY={1} />
          <Text color="muted">Navigate to a sector with a port to trade.</Text>
        </Box>
        <Box paddingY={2} />
        <Text color="muted" dimColor>[Esc] Return to Sector</Text>
      </Box>
    );
  }
  
  // Show trade confirmation dialog
  if (showTradeConfirm && currentCommodity && mode !== 'browse') {
    const total = mode === 'buy' ? buyTotal : sellTotal;
    const action = mode === 'buy' ? 'Buy' : 'Sell';
    const color = mode === 'buy' ? 'red' : 'green';
    
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Box 
          borderStyle="double" 
          borderColor={color}
          paddingX={4}
          paddingY={2}
          flexDirection="column"
          alignItems="center"
        >
          <Text color={color} bold>
            {action === 'Buy' ? '🛒 CONFIRM PURCHASE' : '💰 CONFIRM SALE'}
          </Text>
          
          <Box paddingY={1} />
          
          <Text>
            {action} {quantity} {currentCommodity.label}
          </Text>
          <Text color="muted">
            @ {mode === 'buy' ? currentCommodity.buyPrice : currentCommodity.sellPrice} cr/unit
          </Text>
          
          <Box paddingY={1} />
          
          <Text color={color} bold>
            Total: {total.toLocaleString()} credits
          </Text>
          
          <Box paddingY={1} />
          
          <Text color="muted" dimColor>
            [Enter] Confirm  [Esc] Cancel
          </Text>
        </Box>
      </Box>
    );
  }

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
      <Box borderStyle="round" paddingX={2} paddingY={1} marginBottom={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="cyan" bold>
            CLASS {port.class} PORT — {port.type.toUpperCase()} {port.buying ? 'BUYER' : 'SELLER'}
          </Text>
          <Text color="yellow">
            {shipState.credits.toLocaleString()} cr
          </Text>
        </Box>
      </Box>
      
      {/* Mode indicator */}
      <Box marginBottom={1}>
        <Text 
          color={mode === 'buy' ? 'green' : mode === 'sell' ? 'red' : 'cyan'} 
          bold
        >
          {mode === 'buy' 
            ? '🛒 BUYING: Select quantity to purchase'
            : mode === 'sell' 
              ? '💰 SELLING: Select quantity to sell'
              : '📊 BROWSE: Select commodity, then press [B]uy or [S]ell'}
        </Text>
      </Box>
      
      {/* Main content - 2 column layout */}
      <Box flexDirection="row" gap={3} marginBottom={1}>
        {/* Left: Commodities - fixed width */}
        <Box flexDirection="column" width={40}>
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
        
        {/* Right: Transaction panel - wider for order display */}
        <Box flexDirection="column" width={38}>
          {mode !== 'browse' && currentCommodity && (
            <Box 
              borderStyle="round" 
              borderColor={mode === 'buy' ? 'green' : 'red'}
              paddingX={2}
              paddingY={1}
              flexDirection="column"
            >
              <Text bold color={mode === 'buy' ? 'green' : 'red'}>
                {mode === 'buy' ? '🛒 PURCHASE ORDER' : '💰 SALE ORDER'}
              </Text>
              
              <Box paddingY={1} />
              
              <Text bold>{currentCommodity.label}</Text>
              <Text color="muted">
                @ {mode === 'buy' ? currentCommodity.buyPrice : currentCommodity.sellPrice} cr/unit
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
            <Box borderStyle="single" borderColor="muted" paddingX={2} paddingY={1}>
              <Text color="muted" dimColor>Quick Keys:</Text>
              <Box paddingY={0} />
              <Text color="green">[B] Buy mode</Text>
              <Text color="red">[S] Sell mode</Text>
              <Text color="cyan">[↑↓] Select item</Text>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Cargo display */}
      <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <CargoDisplay cargo={shipState.cargo} maxCargo={shipState.maxCargo} />
      </Box>
      
      {/* Message */}
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
            : '[↑] +  [↓] -  Qty  [Enter] Review  [Esc] Cancel'
          }
        </Text>
      </Box>
    </Box>
  );
};

export default MarketScreen;
