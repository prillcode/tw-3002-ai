import React from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';

export interface SectorScreenProps {
  /** Navigate to market screen. */
  onMarket: () => void;
  
  /** Go back to previous screen. */
  onBack: () => void;
  
  /** Ship name to display. */
  shipName: string;
}

/**
 * Sector view screen - main game navigation hub.
 * Shows current sector and allows movement to connected sectors.
 */
export const SectorScreen: React.FC<SectorScreenProps> = ({ onMarket, onBack, shipName }) => {
  // Keyboard shortcuts
  useKeyHandler({
    onM: onMarket,
    onEscape: onBack,
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Text variant="info" bold>
          SECTOR 42 - FEDERATED SPACE
        </Text>
      </Box>
      
      {/* Sector map placeholder */}
      <Box flexGrow={1} borderStyle="single" padding={1}>
        <Text variant="muted">
          [Sector map will be rendered here]
          
          Connected sectors:
          • Sector 41 (Port: Class II)
          • Sector 43 (Port: Class I)
          • Sector 52 (Empty)
        </Text>
      </Box>
      
      {/* Ship status */}
      <Box borderStyle="single" padding={1} marginTop={1}>
        <Text variant="success">
          Ship: {shipName} | Credits: 5,000 | Hull: 100%
        </Text>
      </Box>
    </Box>
  );
};

export default SectorScreen;
