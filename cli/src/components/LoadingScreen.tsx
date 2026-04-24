import React, { useState, useEffect } from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface LoadingScreenProps {
  message: string;
}

const DOTS = ['   ', '.  ', '.. ', '...'];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotIndex(i => (i + 1) % DOTS.length);
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      padding={2}
    >
      <Box borderStyle="single" borderColor="cyan" paddingX={4} paddingY={2}>
        <Text color="cyan" bold>
          {message}{DOTS[dotIndex]}
        </Text>
      </Box>
    </Box>
  );
};

export default LoadingScreen;
