import React, { useState } from 'react';
import { Box, Text, Menu, AnsiTitle, PressAnyKey, ShipNameInput } from '../components';

type WelcomeState = 'title' | 'menu' | 'shipInput';

export interface WelcomeScreenProps {
  /** Called when New Game flow completes with ship name. */
  onNewGame: (shipName: string) => void;
  
  /** Called when Continue is selected (if saves exist). */
  onContinue?: () => void;
  
  /** Called when Settings is selected. */
  onSettings?: () => void;
  
  /** Called when Quit is selected. */
  onQuit: () => void;
}

/**
 * Welcome screen with authentic BBS-era flow.
 * 
 * Flow:
 * 1. Title screen (ANSI art + "Press any key")
 * 2. Main menu (New Game / Continue / Quit)
 * 3. Ship name input (for new games)
 * 4. Navigate to game
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNewGame, 
  onContinue,
  onSettings,
  onQuit 
}) => {
  const [welcomeState, setWelcomeState] = useState<WelcomeState>('title');
  const [pendingShipName, setPendingShipName] = useState<string>('');

  const menuItems = [
    { id: 'new', label: 'New Game' },
    ...(onContinue ? [{ id: 'continue', label: 'Continue' }] : []),
    ...(onSettings ? [{ id: 'settings', label: 'Settings' }] : []),
    { id: 'quit', label: 'Quit' }
  ];

  const handleMenuSelect = (id: string) => {
    switch (id) {
      case 'new':
        setWelcomeState('shipInput');
        break;
      case 'continue':
        onContinue?.();
        break;
      case 'settings':
        onSettings?.();
        break;
      case 'quit':
        onQuit();
        break;
    }
  };

  const handleShipSubmit = (name: string) => {
    setPendingShipName(name);
    onNewGame(name);
  };

  const handleShipCancel = () => {
    setWelcomeState('menu');
  };

  // Render based on current state
  if (welcomeState === 'title') {
    return (
      <Box 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        padding={2}
      >
        <AnsiTitle />
        
        <Box paddingY={2} />
        
        <PressAnyKey onPress={() => setWelcomeState('menu')} />
      </Box>
    );
  }

  if (welcomeState === 'shipInput') {
    return (
      <ShipNameInput 
        onSubmit={handleShipSubmit}
        onCancel={handleShipCancel}
      />
    );
  }

  // Menu state (default)
  return (
    <Box 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      padding={2}
    >
      <Box 
        borderStyle="round" 
        borderColor="cyan"
        paddingX={3} 
        paddingY={1} 
        marginBottom={2}
        alignItems="center"
      >
        <Text color="cyan" bold> TW 3002 AI </Text>
      </Box>
      
      <Text color="muted" dimColor>
        Main Menu
      </Text>
      
      <Box paddingY={2} />
      
      <Menu 
        items={menuItems}
        onSelect={handleMenuSelect}
        onCancel={onQuit}
      />
    </Box>
  );
};

export default WelcomeScreen;
