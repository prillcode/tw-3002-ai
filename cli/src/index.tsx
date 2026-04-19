import React, { useState, useEffect, useMemo } from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout, ConfirmDialog } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen } from './screens';
import { initDatabase, saveGame, loadGame, hasSave, clearSave, type GameState } from './db';

const App = () => {
  const { currentScreen, navigateTo, goBack } = useScreen({ initial: 'welcome' });
  const db = useMemo(() => initDatabase(), []);
  
  // Track if save exists for showing Continue option
  const [saveExists, setSaveExists] = useState(false);
  
  // Game state (persisted to SQLite)
  const [shipName, setShipName] = useState<string>('');
  const [currentSectorId, setCurrentSectorId] = useState<number>(42);
  const [shipState, setShipState] = useState({
    credits: 5000,
    cargo: {
      ore: 0,
      organics: 0,
      equipment: 0
    },
    maxCargo: 100,
    hull: 100,
    turns: 100,
    maxTurns: 100
  });
  
  // Track new game confirmation
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [pendingShipName, setPendingShipName] = useState<string>('');

  // Check for existing save on mount
  useEffect(() => {
    setSaveExists(hasSave(db));
  }, [db]);
  
  // Auto-save whenever state changes
  useEffect(() => {
    if (shipName) { // Only save after ship is named
      const gameState: GameState = {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns
      };
      saveGame(db, gameState);
      setSaveExists(true);
    }
  }, [shipName, currentSectorId, shipState, db]);

  // Handle new game (with confirmation if save exists)
  const handleNewGameRequest = (name: string) => {
    if (saveExists) {
      setPendingShipName(name);
      setShowNewGameConfirm(true);
    } else {
      startNewGame(name);
    }
  };
  
  // Actually start new game
  const startNewGame = (name: string) => {
    clearSave(db);
    setShipName(name);
    setCurrentSectorId(42);
    setShipState({
      credits: 5000,
      cargo: { ore: 0, organics: 0, equipment: 0 },
      maxCargo: 100,
      hull: 100,
      turns: 100,
      maxTurns: 100
    });
    setSaveExists(false);
    navigateTo('sector');
  };
  
  // Handle continue from save
  const handleContinue = () => {
    const save = loadGame(db);
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
      navigateTo('sector');
    }
  };

  // Handle quit with final save
  const handleQuit = () => {
    if (shipName) {
      saveGame(db, {
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

  // Determine status bar items
  const getStatusItems = () => {
    switch (currentScreen) {
      case 'welcome':
        return [
          { key: '↑↓', action: 'Navigate' },
          { key: 'Enter', action: 'Select' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'sector':
        return [
          { key: '↑↓←→', action: 'Move' },
          { key: 'M', action: 'Market' },
          { key: 'Esc', action: 'Back' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'market':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'B', action: 'Buy' },
          { key: 'S', action: 'Sell' },
          { key: 'Esc', action: 'Back' },
          { key: 'Q', action: 'Quit' }
        ];
      default:
        return [{ key: 'Q', action: 'Quit' }];
    }
  };

  // Show new game confirmation
  if (showNewGameConfirm) {
    return (
      <ConfirmDialog
        message="Starting a new game will overwrite your current save. Continue?"
        onConfirm={() => {
          startNewGame(pendingShipName);
          setShowNewGameConfirm(false);
        }}
        onCancel={() => setShowNewGameConfirm(false)}
        defaultToConfirm={false}
      />
    );
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onNewGame={handleNewGameRequest}
            onContinue={saveExists ? handleContinue : undefined}
            onQuit={handleQuit}
            saveExists={saveExists}
          />
        );
      case 'sector':
        return (
          <SectorScreen
            onMarket={() => navigateTo('market')}
            onBack={() => goBack()}
            shipName={shipName || 'Unnamed Vessel'}
            currentSectorId={currentSectorId}
            onUpdateSector={setCurrentSectorId}
            shipState={{
              ...shipState,
              name: shipName
            }}
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
            onBack={() => goBack()}
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
        return (
          <WelcomeScreen
            onNewGame={handleNewGameRequest}
            onContinue={saveExists ? handleContinue : undefined}
            onQuit={handleQuit}
            saveExists={saveExists}
          />
        );
    }
  };

  return (
    <AppLayout statusItems={getStatusItems()}>
      {renderScreen()}
    </AppLayout>
  );
};

render(<App />);
