import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

/**
 * ANSI art title component for TW 3002 AI.
 * Renders ASCII-style title with authentic BBS colors.
 */
export const AnsiTitle: React.FC = () => {
  // Simplified ASCII art that renders well in terminals
  const titleLines = [
    '╔═══════════════════════════════════════════════════════════╗',
    '║                                                           ║',
    '║   TTTTTTT  WWW       WWW    333333     00000     222222   ║',
    '║      T      WWW     WWW    33    33   00   00   22    22  ║',
    '║      T       WWW   WWW         333    00   00        22   ║',
    '║      T        WWW WWW        333      00   00      22     ║',
    '║      T         WW WW       3333333     0000000   2222222  ║',
    '║                          33    33          00             ║',
    '║                          33    33     00   00   2222222222  ║',
    '║                           3333333     000000              ║',
    '║                                                           ║',
    '║                    AI  EDITION                            ║',
    '║                                                           ║',
    '╚═══════════════════════════════════════════════════════════╝',
  ];

  return (
    <Box flexDirection="column" alignItems="center">
      {titleLines.map((line, index) => (
        <Text key={index} color="cyan">
          {line}
        </Text>
      ))}
    </Box>
  );
};

export default AnsiTitle;
