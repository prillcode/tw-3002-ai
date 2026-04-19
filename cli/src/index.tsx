import React, { useState, useEffect, useMemo } from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout, ConfirmDialog } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen, SlotSelectScreen } from './screens';
import { initDatabase, saveGame, loadGame, hasSave, clearSave, type GameState, type Database } from './db';

type AppMode = 'welcome' | 'slotSelect' | 'shipName' | 'sector' | 'market';
type SelectMode = 'new' | 'continue' | null;

const App = () => {
  const { currentScreen, navigateTo, goBack } = useScreen({ initial: 'welcome' });
  const db = useMemo(() => initDatabase(), []);
  
  // Track current mode/flow
  const [appMode, setAppMode] = useState<AppMode>('welcome');
  const [selectMode, setSelectMode] = useState<SelectMode>(null);
  
  // Selected slot for gameplay
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  
  // Game state (per slot)
  const [shipName, setShipName] = useState<string>('');
  const [currentSectorId, setCurrentSectorId] = useState<number>(42);
  const [shipState, setShipState] = useState({
    credits: 5000,
    cargo: { ore: 0, organics: 0, equipment: 0 },
    maxCargo: 100,
    hull: 100,
    turns: 100,
    maxTurns: 100
  });
  
  // Confirmation dialogs
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  // Auto-save whenever state changes
  useEffect(() => {
    if (shipName && selectedSlot) {
      const gameState: GameState = {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns
      };
      saveGame(db, selectedSlot, gameState);
    }
  }, [shipName, currentSectorId, shipState, selectedSlot, db]);

  // Handle New Game request
  const handleNewGame = () => {
    setSelectMode('new');
    setAppMode('slotSelect');
  };
  
  // Handle Continue request
  const handleContinue = () => {
    setSelectMode('continue');
    setAppMode('slotSelect');
  };
  
  // Handle slot selection
  const handleSelectSlot = (slotId: number, isEmpty: boolean) => {
    setSelectedSlot(slotId);
    
    if (selectMode === 'new') {
      if (isEmpty) {
        // Empty slot - start fresh
        startNewGame(slotId);
      } else {
        // Slot has save - confirm overwrite
        setPendingSlot(slotId);
        setShowNewGameConfirm(true);
      }
    } else if (selectMode === 'continue') {
      // Continue - load existing save
      loadExistingGame(slotId);
    }
  };
  
  // Start fresh game in slot
  const startNewGame = (slotId: number) => {
    clearSave(db, slotId);
    setShipName('');
    setCurrentSectorId(42);
    setShipState({
      credits: 5000,
      cargo: { ore: 0, organics: 0, equipment: 0 },
      maxCargo: 100,
      hull: 100,
      turns: 100,
      maxTurns: 100
    });
    setAppMode('shipName');
  };
  
  // Confirm overwrite and start new
  const confirmOverwrite = () => {
    if (pendingSlot) {
      startNewGame(pendingSlot);
      setShowNewGameConfirm(false);
      setPendingSlot(null);
    }
  };
  
  // Load existing game from slot
  const loadExistingGame = (slotId: number) => {
    const save = loadGame(db, slotId);
    if (save) {
      setShipName(save.shipName);
      setCurrentSectorId(save.currentSector);
      setShipState({
        credits: save.credits,
        cargo: save.cargo,
        maxCargo: 100,
        hull: save.hull,
        turns: save.turns,
        maxTurns: save.maxTurns
      });
      setSelectedSlot(slotId);
      setAppMode('sector');
    }
  };
  
  // Handle ship name submission
  const handleShipNameSubmit = (name: string) => {
    setShipName(name);
    setAppMode('sector');
  };
  
  // Handle quit
  const handleQuit = () => {
    if (shipName && selectedSlot) {
      saveGame(db, selectedSlot, {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns
      });
    }
    process.exit(0);
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (appMode === 'slotSelect') {
      setAppMode('welcome');
      setSelectMode(null);
    } else if (appMode === 'shipName') {
      setAppMode('slotSelect');
    } else if (appMode === 'sector') {
      setAppMode('welcome');
    } else if (appMode === 'market') {
      setAppMode('sector');
    }
  };

  // Render based on current mode
  const renderContent = () => {
    switch (appMode) {
      case 'welcome':
        return (
          <WelcomeScreen
            onNewGame={handleNewGame}
            onContinue={handleContinue}
            onQuit={handleQuit}
            db={db}
          />
        );
        
      case 'slotSelect':
        if (!selectMode) return null;
        return (
          <SlotSelectScreen
            db={db}
            mode={selectMode}
            onSelectSlot={handleSelectSlot}
            onBack={handleBack}
          />
        );
        
      case 'shipName':
        return (
          <WelcomeScreen
            onNewGame={handleShipNameSubmit}
            onQuit={handleQuit}
            db={db}
            skipToShipName
          />
        );
        
      case 'sector':
        return (
          <SectorScreen
            onMarket={() => setAppMode('market')}
            onBack={handleBack}
            shipName={shipName || 'Unnamed Vessel'}
            currentSectorId={currentSectorId}
            onUpdateSector={setCurrentSectorId}
            shipState={{ ...shipState, name: shipName }}
            onUpdateShip={(newState) => {
              setShipState(prev => ({
                ...prev,
                credits: newState.credits,
                cargo: newState.cargo,
                hull: newState.hull,
                turns: newState.turns
              }));
            }}
          />
        );
        
      case 'market':
        return (
          <MarketScreen
            onBack={() => setAppMode('sector')}
            currentSectorId={currentSectorId}
            shipState={{
              name: shipName,
              credits: shipState.credits,
              cargo: shipState.cargo,
              maxCargo: shipState.maxCargo
            }}
            onUpdateShip={(newState) => {
              setShipState(prev => ({
                ...prev,
                credits: newState.credits,
                cargo: newState.cargo
              }));
            }}
          />
        );
        
      default:
        return null;
    }
  };

  // Status bar items based on mode
  const getStatusItems = () => {
    switch (appMode) {
      case 'welcome':
        return [
          { key: '↑↓', action: 'Navigate' },
          { key: 'Enter', action: 'Select' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'slotSelect':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'Enter', action: 'Choose' },
          { key: 'Esc', action: 'Back' }
        ];
      case 'shipName':
        return [
          { key: 'Type', action: 'Name' },
          { key: 'Enter', action: 'Confirm' },
          { key: 'Esc', action: 'Cancel' }
        ];
      case 'sector':
        return [
          { key: '↑↓←→', action: 'Move' },
          { key: 'M', action: 'Market' },
          { key: 'Esc', action: 'Menu' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'market':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'B', action: 'Buy' },
          { key: 'S', action: 'Sell' },
          { key: 'Esc', action: 'Back' }
        ];
      default:
        return [{ key: 'Q', action: 'Quit' }];
    }
  };

  // Show overwrite confirmation
  if (showNewGameConfirm) {
    return (
      <ConfirmDialog
        message={`Galaxy ${pendingSlot === 1 ? 'A' : pendingSlot === 2 ? 'B' : 'C'} already has a save. Overwrite?`}
        onConfirm={confirmOverwrite}
        onCancel={() => {
          setShowNewGameConfirm(false);
          setPendingSlot(null);
        }}
        defaultToConfirm={false}
      />
    );
  }

  return (
    <AppLayout statusItems={getStatusItems()}>
      {renderContent()}
    </AppLayout>
  );
};

render(<App />);
