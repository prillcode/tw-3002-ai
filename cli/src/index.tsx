import React from 'react';
import { render, Text, Box } from 'ink';

const App = () => {
  return (
    <Box borderStyle="round" padding={1}>
      <Text color="green">Hello TW 3002 AI</Text>
    </Box>
  );
};

render(<App />);
