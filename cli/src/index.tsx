import React from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen } from './screens';

/**
 * Main application component.
 * Manages screen routing and provides consistent layout.
 */
const App = () => {
  const { currentScreen, navigateTo, goBack } = useScreen({ initial: 'welcome' });

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
          { key: 'Enter', action: 'Trade' },
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
            onNewGame={() => navigateTo('sector')}
            onQuit={() => process.exit(0)}
          />
        );
      case 'sector':
        return (
          <SectorScreen
            onMarket={() => navigateTo('market')}
            onBack={() => goBack()}
          />
        );
      case 'market':
        return (
          <MarketScreen
            onBack={() => goBack()}
          />
        );
      default:
        return <WelcomeScreen onNewGame={() => navigateTo('sector')} onQuit={() => process.exit(0)} />;
    }
  };

  return (
    <AppLayout statusItems={getStatusItems()}>
      {renderScreen()}
    </AppLayout>
  );
};

render(<App />);
