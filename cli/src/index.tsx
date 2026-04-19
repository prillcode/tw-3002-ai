import React, { useState } from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen } from './screens';

/**
 * Main application component.
 * Manages screen routing, ship state, and sector state.
 */
const App = () => {
  const { currentScreen, navigateTo, goBack } = useScreen({ initial: 'welcome' });
  const [shipName, setShipName] = useState<string>('');
  const [currentSectorId, setCurrentSectorId] = useState<number>(42);
  
  // Ship state (persisted across screens)
  const [shipState, setShipState] = useState({
    name: '',
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

  // Handle ship naming (from welcome flow)
  const handleNewGame = (name: string) => {
    setShipName(name);
    setShipState(prev => ({ ...prev, name }));
    setCurrentSectorId(42);
    navigateTo('sector');
  };

  // Determine status bar items based on current screen
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

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onNewGame={handleNewGame}
            onQuit={() => process.exit(0)}
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
            shipState={shipState}
            onUpdateShip={setShipState}
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
            onNewGame={handleNewGame}
            onQuit={() => process.exit(0)}
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
