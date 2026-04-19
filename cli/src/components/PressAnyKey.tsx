import React, { useState, useEffect } from 'react';
import { useInput } from 'ink';
import { Box } from './Box';
import { Text } from './Text';

export interface PressAnyKeyProps {
  /** Called when any key is pressed. */
  onPress: () => void;
  
  /** Custom prompt text. */
  prompt?: string;
}

/**
 * Classic BBS "Press any key to continue" prompt.
 * Renders blinking text that responds to any keypress.
 */
export const PressAnyKey: React.FC<PressAnyKeyProps> = ({ 
  onPress,
  prompt = 'Press any key to continue'
}) => {
  const [visible, setVisible] = useState(true);

  // Blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(prev => !prev);
    }, 800); // 800ms blink rate
    
    return () => clearInterval(interval);
  }, []);

  // Handle any keypress
  useInput(() => {
    onPress();
  });

  return (
    <Box marginTop={2}>
      <Text color="yellow" bold={visible} dimColor={!visible}>
        {`[ ${prompt} ]`}
      </Text>
    </Box>
  );
};

export default PressAnyKey;
