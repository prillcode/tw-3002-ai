import React, { useState } from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';
import { cloudRegister, cloudVerify, setAuth, type CloudAuth } from '../cloud/client';

export interface CloudLoginScreenProps {
  onLogin: (auth: CloudAuth) => void;
  onBack: () => void;
}

export const CloudLoginScreen: React.FC<CloudLoginScreenProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'input' | 'loading' | 'error'>('input');
  const [message, setMessage] = useState('');

  useKeyHandler({
    onInput: (input, key) => {
      if (status === 'loading') return;

      if (key.return && email.trim().includes('@')) {
        handleSubmit();
      } else if (key.escape) {
        onBack();
      } else if (key.backspace || key.delete) {
        setEmail(prev => prev.slice(0, -1));
      } else if (input.length === 1) {
        setEmail(prev => prev + input);
      }
    },
  });

  const handleSubmit = async () => {
    setStatus('loading');
    setMessage('Connecting to The Void...');

    try {
      const auth = await cloudRegister(email.trim());
      setAuth(auth);
      setMessage('Connected!');
      onLogin(auth);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setStatus('error');
      setMessage(msg);
    }
  };

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
      <Box borderStyle="double" borderColor="cyan" paddingX={3} paddingY={1} marginBottom={2} flexDirection="column" alignItems="center">
        <Text color="cyan" bold> 🌌 PLAY ONLINE </Text>
        <Text color="muted" dimColor>Enter your email to join The Void</Text>
      </Box>

      <Box marginY={1} flexDirection="column" alignItems="center">
        <Text color="white">Email:</Text>
        <Text color="yellow">{email}</Text>
        <Text color="muted" dimColor>_</Text>
      </Box>

      {message && (
        <Box marginY={1}>
          <Text color={status === 'error' ? 'red' : 'green'}>
            {message}
          </Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="muted" dimColor>[Enter] Connect  [Esc] Back</Text>
      </Box>
    </Box>
  );
};

export default CloudLoginScreen;
