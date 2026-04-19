import React, { useState } from 'react';
import { useInput } from 'ink';
import { Box } from './Box';
import { Text } from './Text';

export interface ShipNameInputProps {
  /** Called when name is submitted. */
  onSubmit: (name: string) => void;
  
  /** Called when cancelled. */
  onCancel: () => void;
  
  /** Maximum length for ship name. */
  maxLength?: number;
}

/**
 * Ship name input component with BBS-era styling.
 * Prompts for commander name with cursor and validation.
 */
export const ShipNameInput: React.FC<ShipNameInputProps> = ({ 
  onSubmit,
  onCancel,
  maxLength = 20
}) => {
  const [name, setName] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cursor blink effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle input
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      if (name.trim().length === 0) {
        setError('Ship name cannot be empty');
      } else if (name.trim().length < 2) {
        setError('Ship name must be at least 2 characters');
      } else {
        onSubmit(name.trim());
      }
      return;
    }

    if (key.backspace || key.delete) {
      setName(prev => prev.slice(0, -1));
      setError(null);
      return;
    }

    // Regular character input
    if (input && name.length < maxLength) {
      // Allow alphanumeric, spaces, and common ship name characters
      if (/^[a-zA-Z0-9\s\-'\.]$/.test(input)) {
        setName(prev => prev + input);
        setError(null);
      }
    }
  });

  return (
    <Box 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      padding={2}
    >
      <Box 
        borderStyle="double" 
        borderColor="cyan"
        paddingX={4} 
        paddingY={2}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="cyan" bold>
          NEW COMMANDER REGISTRATION
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="white">
          Welcome to the Trade Wars 3002 galaxy.
        </Text>
        <Text color="muted">
          Register your ship to begin trading.
        </Text>
        
        <Box paddingY={2} />
        
        <Text color="yellow">
          Enter your ship's name:
        </Text>
        
        <Box paddingY={0} />
        
        <Box flexDirection="row">
          <Text color="cyan">{'>'}</Text>
          <Text color="white">{name}</Text>
          <Text color={cursorVisible ? 'cyan' : undefined} dimColor={!cursorVisible}>
            {'_'}
          </Text>
        </Box>
        
        <Box paddingY={1} />
        
        <Text color="muted" dimColor>
          {name.length}/{maxLength} characters
        </Text>
        
        {error && (
          <Box marginTop={1}>
            <Text color="red">{error}</Text>
          </Box>
        )}
        
        <Box paddingY={1} />
        
        <Box flexDirection="row" gap={4}>
          <Text color="green">[Enter] Confirm</Text>
          <Text color="red">[Escape] Cancel</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default ShipNameInput;
