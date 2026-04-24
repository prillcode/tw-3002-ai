import React, { useState } from 'react';
import { homedir } from 'os';
import { Box, Text, Menu, ConfirmDialog } from '../components';
import type { Database } from '../db';

export interface SettingsScreenProps {
  db: Database;
  onBack: () => void;
}

type SettingsState = 'menu' | 'confirmDelete';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ db, onBack }) => {
  const [state, setState] = useState<SettingsState>('menu');
  const savePath = `${homedir()}/.tw3002/saves.db`;

  const handleSelect = (id: string) => {
    switch (id) {
      case 'delete':
        setState('confirmDelete');
        break;
      case 'back':
        onBack();
        break;
    }
  };

  const handleDeleteConfirm = () => {
    try {
      db.exec('DELETE FROM saves; DELETE FROM schema_migrations;');
    } catch {
      // Ignore errors — might be empty
    }
    setState('menu');
  };

  if (state === 'confirmDelete') {
    return (
      <ConfirmDialog
        message="Delete ALL save games? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setState('menu')}
        defaultToConfirm={false}
      />
    );
  }

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
      <Box borderStyle="round" borderColor="cyan" paddingX={3} paddingY={1} marginBottom={2}>
        <Text color="cyan" bold> SETTINGS </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column" alignItems="center">
        <Text color="muted" dimColor>Save file:</Text>
        <Text color="white">{savePath}</Text>
      </Box>

      <Box paddingY={1} />

      <Menu
        items={[
          { id: 'delete', label: '⚠ Delete All Saves' },
          { id: 'back', label: 'Back' },
        ]}
        onSelect={handleSelect}
        onCancel={onBack}
      />
    </Box>
  );
};

export default SettingsScreen;
