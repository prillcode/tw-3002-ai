import React from 'react';
import { Box, Text, Menu } from '../components';

export interface WelcomeScreenProps {
  /** Called when New Game is selected. */
  onNewGame: () => void;
  
  /** Called when Continue is selected. */
  onContinue?: () => void;
  
  /** Called when Settings is selected. */
  onSettings?: () => void;
  
  /** Called when Quit is selected. */
  onQuit: () => void;
}

/**
 * Welcome screen with title and main menu.
 * First screen players see when launching the game.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onNewGame, 
  onContinue,
  onSettings,
  onQuit 
}) => {
  const menuItems = [
    { id: 'new', label: 'New Game' },
    ...(onContinue ? [{ id: 'continue', label: 'Continue' }] : []),
    ...(onSettings ? [{ id: 'settings', label: 'Settings' }] : []),
    { id: 'quit', label: 'Quit' }
  ];

  const handleSelect = (id: string) => {
    switch (id) {
      case 'new':
        onNewGame();
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

  return (
    <Box flexDirection="column" alignItems="center" padding={2}>
      {/* Title */}
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Text variant="success" bold>
          ╔═══════════════════════════╗
          ║  TW 3002 AI               ║
          ║  A Trade Wars 2002 Revival ║
          ╚═══════════════════════════╝
        </Text>
      </Box>
      
      {/* Subtitle */}
      <Text variant="muted" bold>
        Terminal-native space trading with LLM-driven NPCs
      </Text>
      
      <Box padding={2} />
      
      {/* Menu */}
      <Menu 
        items={menuItems}
        onSelect={handleSelect}
        onCancel={onQuit}
      />
    </Box>
  );
};

export default WelcomeScreen;
