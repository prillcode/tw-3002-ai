import React, { useState, useMemo } from 'react';
import { Box, Text, ConfirmDialog } from '../components';
import { useKeyHandler } from '../hooks';
import type { CombatResult, CombatRound, Combatant } from '@tw3002/engine';

export interface CombatScreenProps {
  player: Combatant;
  enemy: Combatant;
  onCombatEnd: (result: CombatResult) => void;
  onQuit: () => void;
}

type CombatPhase = 'intro' | 'action' | 'round' | 'result' | 'destroyed';

export const CombatScreen: React.FC<CombatScreenProps> = ({
  player: initialPlayer,
  enemy: initialEnemy,
  onCombatEnd,
  onQuit,
}) => {
  const [phase, setPhase] = useState<CombatPhase>('intro');
  const [combatState, setCombatState] = useState(() => {
    // Import dynamically to avoid circular deps
    const { initiateCombat } = require('@tw3002/engine');
    return initiateCombat(initialPlayer, initialEnemy);
  });
  const [rounds, setRounds] = useState<CombatRound[]>([]);
  const [currentRound, setCurrentRound] = useState<CombatRound | null>(null);
  const [selectedAction, setSelectedAction] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const actions = ['attack', 'flee', 'bribe'] as const;

  // Compute flee chance and bribe amount for display
  const { computeFleeChance, computeBribeAmount } = useMemo(() => {
    return require('@tw3002/engine');
  }, []);

  const fleeChance = useMemo(() => {
    try { return computeFleeChance(combatState.player, combatState.enemy); }
    catch { return 50; }
  }, [combatState.player, combatState.enemy, computeFleeChance]);

  const bribeAmount = useMemo(() => {
    try { return computeBribeAmount(combatState.enemy, combatState.player.credits); }
    catch { return 500; }
  }, [combatState.enemy, combatState.player.credits, computeBribeAmount]);

  const canBribe = combatState.player.credits >= bribeAmount;

  const handleAction = (actionIndex: number) => {
    if (phase !== 'intro' && phase !== 'action') return;

    const action = actions[actionIndex];
    if (action === 'bribe' && !canBribe) return;

    const { resolveRound } = require('@tw3002/engine');
    const { state, round } = resolveRound(combatState, action);

    setCombatState(state);
    setCurrentRound(round);
    setRounds(prev => [...prev, round]);
    setPhase('round');

    // Auto-transition to result after a brief pause
    if (state.isOver && state.result) {
      const { computeResult } = require('@tw3002/engine');
      const result = computeResult(state, [...rounds, round]);
      setTimeout(() => {
        if (result.playerDestroyed) {
          setPhase('destroyed');
        } else {
          setPhase('result');
        }
      }, 1500);
    } else {
      setTimeout(() => {
        setPhase('action');
        setCurrentRound(null);
      }, 1500);
    }
  };

  const handleEndCombat = () => {
    if (!combatState.isOver || !combatState.result) return;
    const { computeResult } = require('@tw3002/engine');
    const result = computeResult(combatState, rounds);
    onCombatEnd(result);
  };

  useKeyHandler({
    onUp: () => {
      if (phase === 'intro' || phase === 'action') {
        setSelectedAction(prev => (prev > 0 ? prev - 1 : prev));
      }
    },
    onDown: () => {
      if (phase === 'intro' || phase === 'action') {
        setSelectedAction(prev => (prev < actions.length - 1 ? prev + 1 : prev));
      }
    },
    onReturn: () => {
      if (phase === 'intro' || phase === 'action') {
        handleAction(selectedAction);
      } else if (phase === 'result' || phase === 'destroyed') {
        handleEndCombat();
      }
    },
    onQ: () => setShowQuitConfirm(true),
    isActive: phase !== 'round',
  });

  // Quick action keys
  useKeyHandler({
    onInput: (input: string) => {
      if (phase !== 'intro' && phase !== 'action') return;
      if (input === 'a') handleAction(0);
      if (input === 'f') handleAction(1);
      if (input === 'b' && canBribe) handleAction(2);
    },
    isActive: phase === 'intro' || phase === 'action',
  });

  const getThreatLevel = (enemy: Combatant) => {
    const score = (enemy.weaponDamage / 5) + (enemy.maxHull / 50) + (enemy.maxShield / 20);
    return Math.min(5, Math.max(1, Math.round(score)));
  };

  const renderHealthBar = (current: number, max: number, color: string) => {
    const pct = max > 0 ? current / max : 0;
    const blocks = Math.round(pct * 10);
    const bar = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
    return (
      <Text color={color as any}>
        {`[${bar}] ${Math.round(current)}/${Math.round(max)}`}
      </Text>
    );
  };

  if (showQuitConfirm) {
    return (
      <ConfirmDialog
        message="Quit the game and return to shell?"
        onConfirm={onQuit}
        onCancel={() => setShowQuitConfirm(false)}
        defaultToConfirm={false}
      />
    );
  }

  // ── DESTROYED ──
  if (phase === 'destroyed') {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Box borderStyle="double" borderColor="red" paddingX={4} paddingY={2} flexDirection="column" alignItems="center">
          <Text color="red" bold>💥 SHIP DESTROYED</Text>
          <Box paddingY={1} />
          <Text>Your ship has been destroyed in combat.</Text>
          <Box paddingY={1} />
          <Text color="yellow">Emergency pod ejected to FedSpace.</Text>
          <Text color="muted">You lost 10% of your credits.</Text>
          <Box paddingY={1} />
          <Text color="cyan" dimColor>[Enter] Continue</Text>
        </Box>
      </Box>
    );
  }

  // ── RESULT ──
  if (phase === 'result' && combatState.result) {
    const result = combatState.result;
    const won = result.victory;
    const fled = result.fled;
    const bribed = result.bribed;

    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Box
          borderStyle="double"
          borderColor={won ? 'green' : fled ? 'yellow' : bribed ? 'cyan' : 'red'}
          paddingX={4}
          paddingY={2}
          flexDirection="column"
          alignItems="center"
        >
          <Text color={won ? 'green' : fled ? 'yellow' : bribed ? 'cyan' : 'red'} bold>
            {won ? '🏆 VICTORY' : fled ? '🏃 ESCAPED' : bribed ? '💰 BRIBED' : '☠️ DEFEATED'}
          </Text>

          <Box paddingY={1} />

          <Text>Combat lasted {result.rounds.length} round(s)</Text>
          <Text>Damage dealt: {Math.round(result.totalDamageDealt)}</Text>
          <Text>Damage taken: {Math.round(result.totalDamageTaken)}</Text>

          {result.creditsGained > 0 && (
            <Text color="green">Credits gained: +{result.creditsGained.toLocaleString()}</Text>
          )}
          {result.creditsLost > 0 && (
            <Text color="red">Credits lost: -{result.creditsLost.toLocaleString()}</Text>
          )}

          <Box paddingY={1} />

          <Text color="cyan" dimColor>[Enter] Return to Sector</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="double" borderColor="red" paddingX={2} paddingY={1} marginBottom={1}>
        <Text color="red" bold>⚔️  COMBAT ENCOUNTER</Text>
      </Box>

      {/* Enemy Info */}
      <Box borderStyle="round" borderColor="red" paddingX={2} paddingY={1} marginBottom={1} flexDirection="column">
        <Text color="red" bold>{combatState.enemy.name}</Text>
        <Box flexDirection="row" gap={2}>
          <Text color="muted">Threat:</Text>
          <Text color="red">{'★'.repeat(getThreatLevel(combatState.enemy))}{'☆'.repeat(5 - getThreatLevel(combatState.enemy))}</Text>
        </Box>
        <Box paddingY={0} />
        <Text color="muted">Hull:</Text>
        {renderHealthBar(combatState.enemy.hull, combatState.enemy.maxHull, 'red')}
        {combatState.enemy.maxShield > 0 && (
          <>
            <Text color="muted">Shield:</Text>
            {renderHealthBar(combatState.enemy.shield, combatState.enemy.maxShield, 'cyan')}
          </>
        )}
      </Box>

      {/* Round Log */}
      {(phase === 'round' && currentRound) ? (
        <Box borderStyle="single" borderColor="yellow" paddingX={2} paddingY={1} marginBottom={1} flexDirection="column">
          <Text color="yellow" bold>─── ROUND {currentRound.round} ───</Text>
          {currentRound.log.map((line, i) => (
            <Text key={i} color={line.includes('Hit') ? 'red' : line.includes('Missed') ? 'muted' : 'white'}>
              {line}
            </Text>
          ))}
        </Box>
      ) : rounds.length > 0 ? (
        <Box borderStyle="single" borderColor="muted" paddingX={2} paddingY={1} marginBottom={1} flexDirection="column">
          <Text color="muted" dimColor>Last round:</Text>
          {rounds[rounds.length - 1]!.log.slice(-2).map((line, i) => (
            <Text key={i} color="muted" dimColor>{line}</Text>
          ))}
        </Box>
      ) : null}

      {/* Player Status */}
      <Box borderStyle="round" borderColor="green" paddingX={2} paddingY={1} marginBottom={1} flexDirection="column">
        <Text color="green" bold>{combatState.player.name}</Text>
        <Box paddingY={0} />
        <Text color="muted">Hull:</Text>
        {renderHealthBar(combatState.player.hull, combatState.player.maxHull, getHullColor(combatState.player.hull, combatState.player.maxHull))}
        {combatState.player.maxShield > 0 && (
          <>
            <Text color="muted">Shield:</Text>
            {renderHealthBar(combatState.player.shield, combatState.player.maxShield, 'cyan')}
          </>
        )}
        <Box paddingY={0} />
        <Text color="muted">Credits: {combatState.player.credits.toLocaleString()}</Text>
      </Box>

      {/* Actions */}
      {(phase === 'intro' || phase === 'action') && (
        <Box borderStyle="single" borderColor="cyan" paddingX={2} paddingY={1} flexDirection="column">
          <Text color="cyan" bold>CHOOSE ACTION:</Text>
          <Box paddingY={0} />

          <Box flexDirection="row">
            <Text color={selectedAction === 0 ? 'green' : 'muted'}>
              {selectedAction === 0 ? '▶ ' : '  '}[A]ttack
            </Text>
          </Box>

          <Box flexDirection="row">
            <Text color={selectedAction === 1 ? 'yellow' : 'muted'}>
              {selectedAction === 1 ? '▶ ' : '  '}[F]lee ({Math.round(fleeChance)}% chance)
            </Text>
          </Box>

          <Box flexDirection="row">
            <Text color={selectedAction === 2 ? 'cyan' : !canBribe ? 'gray' : 'muted'}>
              {selectedAction === 2 ? '▶ ' : '  '}[B]ribe ({bribeAmount.toLocaleString()} cr)
              {!canBribe && <Text color="red"> — can't afford</Text>}
            </Text>
          </Box>
        </Box>
      )}

      {/* Help bar */}
      <Box flexDirection="row" justifyContent="center" marginTop={1}>
        <Text color="muted" dimColor>
          {phase === 'round' ? 'Resolving...' : '[↑↓] Select  [Enter] Confirm  [Q] Quit'}
        </Text>
      </Box>
    </Box>
  );
};

function getHullColor(hull: number, maxHull: number): string {
  const pct = hull / maxHull;
  if (pct < 0.25) return 'red';
  if (pct < 0.75) return 'yellow';
  return 'green';
}

export default CombatScreen;
