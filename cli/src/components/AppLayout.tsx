import React from 'react';
import { Box } from 'ink';
import { StatusBar, type StatusBarItem } from './StatusBar';

export interface AppLayoutProps {
  /** Main content to render in the center area. */
  children: React.ReactNode;
  
  /** Status bar items (key hints). */
  statusItems: StatusBarItem[];
}

/**
 * Root layout component for the TUI.
 * Provides full-screen container with main content area and persistent StatusBar.
 * 
 * @example
 * <AppLayout statusItems={[{key: '↑↓', action: 'Navigate'}, {key: 'Q', action: 'Quit'}]}>
 *   <WelcomeScreen />
 * </AppLayout>
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, statusItems }) => {
  return (
    <Box flexDirection="column" height="100%">
      {/* Main content area - takes remaining space */}
      <Box flexGrow={1} flexDirection="column">
        {children}
      </Box>
      
      {/* StatusBar - always at bottom */}
      <StatusBar items={statusItems} />
    </Box>
  );
};

export default AppLayout;
