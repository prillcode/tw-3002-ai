import React from 'react';
import { useInput } from 'ink';
import { Box } from './Box';
import { Text } from './Text';

export interface ConfirmDialogProps {
  /** Message to display */
  message: string;
  /** Called when confirmed (Yes selected) */
  onConfirm: () => void;
  /** Called when cancelled (No selected) */
  onCancel: () => void;
  /** Initial selection - defaults to cancel (false) for safety */
  defaultToConfirm?: boolean;
}

/**
 * Confirmation dialog with Yes/No options.
 * Classic BBS-style confirmation with clear visual distinction.
 * 
 * @example
 * <ConfirmDialog
 *   message="Are you sure you want to quit?"
 *   onConfirm={() => process.exit(0)}
 *   onCancel={() => setShowDialog(false)}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
  defaultToConfirm = false
}) => {
  const [isConfirmSelected, setIsConfirmSelected] = React.useState(defaultToConfirm);

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      setIsConfirmSelected(prev => !prev);
    } else if (key.return) {
      if (isConfirmSelected) {
        onConfirm();
      } else {
        onCancel();
      }
    } else if (key.escape) {
      onCancel();
    } else if (input === 'y' || input === 'Y') {
      onConfirm();
    } else if (input === 'n' || input === 'N') {
      onCancel();
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
        borderColor="yellow"
        paddingX={4}
        paddingY={2}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="yellow" bold>
          ⚠ CONFIRMATION REQUIRED
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="white">
          {message}
        </Text>
        
        <Box paddingY={2} />
        
        <Box flexDirection="row" gap={4}>
          <Box 
            borderStyle={isConfirmSelected ? 'round' : 'single'}
            borderColor={isConfirmSelected ? 'green' : 'gray'}
            paddingX={3}
            paddingY={0}
          >
            <Text 
              color={isConfirmSelected ? 'green' : 'muted'} 
              bold={isConfirmSelected}
            >
              {isConfirmSelected ? '→ YES' : '  YES'}
            </Text>
          </Box>
          
          <Box 
            borderStyle={!isConfirmSelected ? 'round' : 'single'}
            borderColor={!isConfirmSelected ? 'red' : 'gray'}
            paddingX={3}
            paddingY={0}
          >
            <Text 
              color={!isConfirmSelected ? 'red' : 'muted'} 
              bold={!isConfirmSelected}
            >
              {!isConfirmSelected ? '→ NO' : '  NO'}
            </Text>
          </Box>
        </Box>
        
        <Box paddingY={1} />
        
        <Text color="muted" dimColor>
          [← →] Select  [Enter] Confirm  [Y/N] Quick select  [Esc] Cancel
        </Text>
      </Box>
    </Box>
  );
};

export default ConfirmDialog;
