import React, { useState } from 'react';
import { useInput } from 'ink';
import { Box, Text } from '../components';

export interface GalaxySize {
  id: 'small' | 'medium' | 'large';
  label: string;
  sectorCount: number;
  description: string;
}

export const GALAXY_SIZES: GalaxySize[] = [
  {
    id: 'small',
    label: 'Small Galaxy',
    sectorCount: 100,
    description: '100 sectors — Quick sessions, tight trading routes',
  },
  {
    id: 'medium',
    label: 'Medium Galaxy',
    sectorCount: 500,
    description: '500 sectors — More exploration, longer trade loops',
  },
  {
    id: 'large',
    label: 'Large Galaxy',
    sectorCount: 1000,
    description: '1,000 sectors — Deep space, slow generation (~2s)',
  },
];

export interface GalaxySizeScreenProps {
  onSelect: (sectorCount: number) => void;
  onBack: () => void;
}

export const GalaxySizeScreen: React.FC<GalaxySizeScreenProps> = ({
  onSelect,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < GALAXY_SIZES.length - 1 ? prev + 1 : prev));
    } else if (key.return) {
      onSelect(GALAXY_SIZES[selectedIndex]!.sectorCount);
    } else if (key.escape) {
      onBack();
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
        minWidth={54}
      >
        <Text color="cyan" bold>
          {'       CHOOSE GALAXY SIZE       '}
        </Text>

        <Box paddingY={1} />

        <Text color="muted" dimColor>
          {'   Larger galaxies take longer to generate   '}
        </Text>

        <Box paddingY={1} />

        {GALAXY_SIZES.map((size, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box
              key={size.id}
              flexDirection="column"
              borderStyle={isSelected ? 'round' : undefined}
              borderColor={isSelected ? 'cyan' : undefined}
              paddingX={isSelected ? 1 : 0}
              marginY={0}
            >
              <Box flexDirection="row">
                <Text
                  color={isSelected ? 'cyan' : 'white'}
                  bold={isSelected}
                >
                  {isSelected ? '▶ ' : '  '}
                  {size.label}
                </Text>
              </Box>
              <Text color="muted" dimColor>
                {'    '}{size.description}
              </Text>
            </Box>
          );
        })}

        <Box paddingY={1} />

        <Text color="muted" dimColor>
          {'   [↑↓] Select  [Enter] Choose  [Esc] Back   '}
        </Text>
      </Box>
    </Box>
  );
};

export default GalaxySizeScreen;
