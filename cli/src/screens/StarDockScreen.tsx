import React, { useState, useMemo } from 'react';
import { useInput } from 'ink';
import { Box, Text, ConfirmDialog } from '../components';
import {
  getAvailableUpgrades,
  getOwnedUpgrades,
  purchaseUpgrade,
  computeEffectiveStats,
  UPGRADE_CATALOG,
} from '@tw3002/engine';
import type { Galaxy, PlayerShip } from '@tw3002/engine';

export interface StarDockScreenProps {
  galaxy: Galaxy;
  ship: PlayerShip;
  onUpdateShip: (ship: PlayerShip) => void;
  onBack: () => void;
}

export const StarDockScreen: React.FC<StarDockScreenProps> = ({
  galaxy,
  ship,
  onUpdateShip,
  onBack,
}) => {
  const availableUpgrades = useMemo(
    () => getAvailableUpgrades(ship.upgrades),
    [ship.upgrades]
  );
  const ownedUpgrades = useMemo(
    () => getOwnedUpgrades(ship.upgrades),
    [ship.upgrades]
  );
  const effectiveStats = useMemo(
    () => computeEffectiveStats(ship.classId, ship.upgrades),
    [ship.classId, ship.upgrades]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUpgradeId, setPendingUpgradeId] = useState<string | null>(null);

  const selectedUpgrade = availableUpgrades[selectedIndex];

  useInput((_input, key) => {
    if (showConfirm) return; // handled by confirm dialog
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      setMessage(null);
    } else if (key.downArrow) {
      setSelectedIndex(prev => (prev < availableUpgrades.length - 1 ? prev + 1 : prev));
      setMessage(null);
    } else if (key.return && selectedUpgrade) {
      setPendingUpgradeId(selectedUpgrade.id);
      setShowConfirm(true);
    } else if (key.escape) {
      onBack();
    }
  });

  const handlePurchase = () => {
    if (!pendingUpgradeId) return;
    const result = purchaseUpgrade(ship, pendingUpgradeId);
    if (result.success) {
      onUpdateShip(result.ship);
      setMessage(`Installed: ${UPGRADE_CATALOG.find(u => u.id === pendingUpgradeId)?.name}`);
      // Clamp selection if list shrunk
      if (selectedIndex >= availableUpgrades.length - 1) {
        setSelectedIndex(Math.max(0, availableUpgrades.length - 2));
      }
    } else {
      setMessage(result.reason ?? 'Purchase failed');
    }
    setShowConfirm(false);
    setPendingUpgradeId(null);
  };

  if (showConfirm && selectedUpgrade) {
    return (
      <ConfirmDialog
        message={`Install ${selectedUpgrade.name} for ${selectedUpgrade.cost.toLocaleString()} credits?`}
        onConfirm={handlePurchase}
        onCancel={() => {
          setShowConfirm(false);
          setPendingUpgradeId(null);
        }}
        defaultToConfirm={false}
      />
    );
  }

  const canAfford = selectedUpgrade ? ship.credits >= selectedUpgrade.cost : false;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="cyan" paddingX={2} paddingY={1} marginBottom={1}>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="cyan" bold>
            STARDOCK — SHIP UPGRADES
          </Text>
          <Text color="yellow">
            {ship.credits.toLocaleString()} cr
          </Text>
        </Box>
      </Box>

      {/* Ship stats summary */}
      <Box borderStyle="single" borderColor="muted" paddingX={2} paddingY={1} marginBottom={1} flexDirection="row" gap={3}>
        <Text color="muted">
          Cargo: <Text color="white" bold>{effectiveStats.maxCargo}</Text>
        </Text>
        <Text color="muted">
          Hull: <Text color="white" bold>{effectiveStats.maxHull}</Text>
        </Text>
        <Text color="muted">
          Turns: <Text color="white" bold>{effectiveStats.maxTurns}</Text>
        </Text>
        <Text color="muted">
          Shields: <Text color="white" bold>{effectiveStats.shieldPoints}</Text>
        </Text>
        <Text color="muted">
          Weapons: <Text color="white" bold>+{effectiveStats.combatBonus}</Text>
        </Text>
      </Box>

      {/* Two columns: Available | Owned */}
      <Box flexDirection="row" gap={3}>
        {/* Left: Available upgrades */}
        <Box flexDirection="column" width={50}>
          <Box marginBottom={1}>
            <Text color="cyan" bold>
              AVAILABLE UPGRADES
            </Text>
          </Box>

          {availableUpgrades.length === 0 ? (
            <Box borderStyle="single" borderColor="muted" paddingX={2} paddingY={1}>
              <Text color="muted" dimColor>All upgrades installed!</Text>
            </Box>
          ) : (
            availableUpgrades.map((upgrade, index) => {
              const isSelected = index === selectedIndex;
              const affordable = ship.credits >= upgrade.cost;
              return (
                <Box
                  key={upgrade.id}
                  flexDirection="column"
                  borderStyle={isSelected ? 'round' : undefined}
                  borderColor={isSelected ? 'cyan' : undefined}
                  paddingX={isSelected ? 1 : 0}
                  marginY={0}
                >
                  <Box flexDirection="row">
                    <Text
                      color={isSelected ? 'cyan' : affordable ? 'white' : 'muted'}
                      bold={isSelected}
                    >
                      {isSelected ? '▶ ' : '  '}
                      {upgrade.name}
                    </Text>
                    <Text color={affordable ? 'yellow' : 'red'} dimColor={!affordable}>
                      {' '}{upgrade.cost.toLocaleString()} cr
                    </Text>
                  </Box>
                  <Text color="muted" dimColor>
                    {'    '}{upgrade.description}
                  </Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right: Owned upgrades */}
        <Box flexDirection="column" width={28}>
          <Box marginBottom={1}>
            <Text color="green" bold>
              INSTALLED
            </Text>
          </Box>

          {ownedUpgrades.length === 0 ? (
            <Text color="muted" dimColor>None yet</Text>
          ) : (
            ownedUpgrades.map(upgrade => (
              <Text key={upgrade.id} color="green">
                {'✓ '}{upgrade.name}
              </Text>
            ))
          )}
        </Box>
      </Box>

      {/* Message */}
      {message && (
        <Box marginTop={1}>
          <Text color={message.startsWith('Installed') ? 'green' : 'red'} bold>
            {message}
          </Text>
        </Box>
      )}

      {/* Help */}
      <Box marginTop={1}>
        <Text color="muted" dimColor>
          [↑↓] Select  [Enter] Buy  [Esc] Leave
        </Text>
      </Box>
    </Box>
  );
};

export default StarDockScreen;
