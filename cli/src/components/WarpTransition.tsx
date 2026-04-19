import React, { useState, useEffect } from 'react';
import { Box } from './Box';
import { Text } from './Text';

export interface WarpTransitionProps {
  /** Destination sector number */
  targetSector: number;
  /** Sector name */
  sectorName: string;
  /** Called when animation completes */
  onComplete: () => void;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Animated warp transition with dots and status messages.
 * Shows when jumping between sectors.
 */
export const WarpTransition: React.FC<WarpTransitionProps> = ({
  targetSector,
  sectorName,
  onComplete,
  duration = 2000
}) => {
  const [dots, setDots] = useState(1);
  const [phase, setPhase] = useState(0);
  
  const phases = [
    'Initializing warp drive...',
    'Engaging subspace engines...',
    'In transit...',
    'Arriving at destination...'
  ];

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(prev => (prev >= 4 ? 1 : prev + 1));
    }, 400);
    
    // Progress through phases
    const phaseInterval = setInterval(() => {
      setPhase(prev => {
        if (prev >= phases.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, duration / phases.length);
    
    // Complete after duration
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, duration);
    
    return () => {
      clearInterval(dotInterval);
      clearInterval(phaseInterval);
      clearTimeout(completeTimeout);
    };
  }, [duration, onComplete]);

  const dotString = '.'.repeat(dots);

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
          WARP TRANSIT
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="yellow" bold>
          Destination: Sector {targetSector}
        </Text>
        <Text color="muted">
          {sectorName}
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="white">
          {phases[phase]}{dotString}
        </Text>
        
        <Box paddingY={1} />
        
        <Text color="magenta" dimColor>
          Please stand by...
        </Text>
      </Box>
    </Box>
  );
};

export default WarpTransition;
