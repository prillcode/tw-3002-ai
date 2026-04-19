import React from 'react';
import { Box } from './Box';
import { Text } from './Text';

/**
 * ANSI art title component for TW 3002 AI.
 * Renders clean ASCII-style title with authentic BBS colors.
 */
export const AnsiTitle: React.FC = () => {
  return (
    <Box flexDirection="column" alignItems="center" paddingY={1}>
      {/* Main Title Box */}
      <Box 
        borderStyle="double" 
        borderColor="cyan"
        paddingX={2} 
        paddingY={1}
        flexDirection="column"
        alignItems="center"
      >
        {/* TW 3002 - Large ASCII Letters with CORRECT numbers */}
        <Text color="cyan" bold>
          {'████████╗ ██╗    ██╗ ██████╗  ██████╗  ██████╗  ██████╗ '}
        </Text>
        <Text color="cyan" bold>
          {'╚══██╔══╝ ██║    ██║ ╚════██╗ ██╔═████╗ ██╔═████╗ ██╔═████╗'}
        </Text>
        <Text color="cyan" bold>
          {'   ██║    ██║ █╗ ██║  █████╔╝ ██║██╔██║ ██║██╔██║ ██║██╔██║'}
        </Text>
        <Text color="cyan" bold>
          {'   ██║    ██║███╗██║ ╚═══██╗ ████╔╝██║ ████╔╝██║ ████╔╝██║'}
        </Text>
        <Text color="cyan" bold>
          {'   ██║    ╚███╔███╔╝ ██████╔╝ ╚██████╔╝ ╚██████╔╝ ╚██████╔╝'}
        </Text>
        <Text color="cyan" bold>
          {'   ╚═╝     ╚══╝╚══╝  ╚═════╝   ╚═════╝   ╚═════╝   ╚═════╝ '}
        </Text>
        
        <Box paddingY={1} />
        
        {/* AI Badge */}
        <Box 
          borderStyle="single" 
          borderColor="magenta"
          paddingX={4}
          paddingY={0}
        >
          <Text color="magenta" bold>
            {' A I '}
          </Text>
        </Box>
      </Box>
      
      {/* Subtitle */}
      <Box marginTop={2}>
        <Text color="yellow" dimColor>
          A Trade Wars 2002 Revival
        </Text>
      </Box>
      
      <Box marginTop={0}>
        <Text color="magenta" dimColor>
          with LLM-Driven NPCs
        </Text>
      </Box>
    </Box>
  );
};

export default AnsiTitle;
