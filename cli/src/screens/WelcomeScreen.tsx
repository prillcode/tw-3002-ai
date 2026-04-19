import React, { useState } from 'react';
import { Box, Text, Menu, AnsiTitle, PressAnyKey, ShipNameInput } from '../components';
import type { Database } from '../db';
import { hasAnySave } from '../db';

type WelcomeState = 'title' | 'menu' | 'shipInput';

export interface WelcomeScreenProps {
  /** Called when New Game flow completes with ship name. */
  onNewGame: (shipName: string) => void;
  
  /** Called when Continue is selected (if saves exist). */
  onContinue?: () => void;
  
  /** Called when Quit is selected. */
  onQuit: () => void;
  
  /** Database instance for checking saves. */
  db: Database;
  
  /** Skip to ship name input directly (for new game in slot). */
  skipToShipName?: boolean;
}

/**
 * Welcome screen with authentic BBS-era flow.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNewGame, 
  onContinue,
  onQuit,
  db,
  skipToShipName = false
}) => {
  const [welcomeState, setWelcomeState] = useState<WelcomeState>(
    skipToShipName ? 'shipInput' : 'title'
  );
  const [saveExists, setSaveExists] = useState(() => hasAnySave(db));

  // Check for saves when entering menu
  const checkSavesAndShowMenu = () => {
    setSaveExists(hasAnySave(db));
    setWelcomeState('menu');
  };

  const menuItems = [
    { id: 'new', label: 'New Game' },
    ...(onContinue && saveExists ? [{ id: 'continue', label: 'Continue' }] : []),
    { id: 'quit', label: 'Quit' }
  ];

  const handleMenuSelect = (id: string) => {
    switch (id) {
      case 'new':
        onNewGame(''); // Trigger slot selection in parent
        break;
      case 'continue':
        onContinue?.();
        break;
      case 'quit':
        onQuit();
        break;
    }
  };

  const handleShipSubmit = (name: string) => {
    onNewGame(name);
  };

  const handleShipCancel = () => {
    if (skipToShipName) {
      onQuit(); // Go back to slot select via quit
    } else {
      setWelcomeState('menu');
    }
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
        
        <Text color="magenta" dimColor>
          A Trade Wars 2002 Revival with LLM-Driven NPCs
        </Text>
        
        {saveExists && (
          <Box marginTop={1}>
            <Text color="green" dimColor>
              ✓ Save game(s) detected
            </Text>
          </Box>
        )}
        
        <PressAnyKey onPress={checkSavesAndShowMenu} />
      </Box>
    );
  }

  if (welcomeState === 'shipInput' || skipToShipName) {
    return (
      <ShipNameInput 
        onSubmit={handleShipSubmit}
        onCancel={handleShipCancel}
      />
    );
  }

  // Menu state
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
        {saveExists ? 'Resume your journey or start anew' : 'Main Menu'}
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
