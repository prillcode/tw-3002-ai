import React, { useState, useEffect } from 'react';
import { Box, Text } from '../components';
import { useKeyHandler } from '../hooks';
import { cloudGetLeaderboard, type CloudAuth } from '../cloud/client';

export interface LeaderboardScreenProps {
  auth: CloudAuth;
  galaxyId: number;
  currentPlayerEmail: string;
  onBack: () => void;
}

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  shipName: string;
  classId: string;
  netWorth: number;
  kills: number;
  deaths: number;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  auth,
  galaxyId,
  currentPlayerEmail,
  onBack,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useKeyHandler({
    onEscape: onBack,
    onL: onBack,
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await cloudGetLeaderboard(galaxyId, 10);
        const mapped = (data.leaderboard || []).map((row: any, i: number) => ({
          rank: i + 1,
          displayName: row.display_name || row.email || 'Unknown',
          shipName: row.ship_name || 'Unnamed',
          classId: row.class_id || 'merchant',
          netWorth: row.net_worth ?? 0,
          kills: row.kills ?? 0,
          deaths: row.deaths ?? 0,
        }));
        setEntries(mapped);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [galaxyId]);

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" padding={2}>
        <Text color="cyan" bold>🏆 Loading leaderboard...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" alignItems="center" padding={2}>
        <Text color="red" bold>Error</Text>
        <Text color="white">{error}</Text>
        <Box marginTop={1}>
          <Text color="muted" dimColor>[Esc] Back</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="yellow" paddingX={2} paddingY={1} flexDirection="column">
        <Text color="yellow" bold>🏆 LEADERBOARD</Text>
        <Text color="muted" dimColor>Top pilots by net worth</Text>
      </Box>

      <Box paddingY={1} />

      {entries.length === 0 ? (
        <Text color="muted">No pilots registered yet.</Text>
      ) : (
        <Box flexDirection="column">
          {/* Header */}
          <Box flexDirection="row" gap={1}>
            <Box width={4}><Text color="cyan" bold>#</Text></Box>
            <Box width={14}><Text color="cyan" bold>Ship</Text></Box>
            <Box width={10}><Text color="cyan" bold>Class</Text></Box>
            <Box width={12}><Text color="cyan" bold>Net Worth</Text></Box>
            <Box width={6}><Text color="cyan" bold>Kills</Text></Box>
            <Box width={6}><Text color="cyan" bold>Deaths</Text></Box>
          </Box>

          {entries.map((e) => {
            const isCurrent = e.displayName === currentPlayerEmail || e.displayName.includes(currentPlayerEmail);
            return (
              <Box key={e.rank} flexDirection="row" gap={1}>
                <Box width={4}>
                  <Text color={isCurrent ? 'yellow' : 'white'} bold={isCurrent}>{e.rank}</Text>
                </Box>
                <Box width={14}>
                  <Text color={isCurrent ? 'yellow' : 'white'} bold={isCurrent}>{e.shipName}</Text>
                </Box>
                <Box width={10}>
                  <Text color="muted">{e.classId}</Text>
                </Box>
                <Box width={12}>
                  <Text color="green">{e.netWorth.toLocaleString()} cr</Text>
                </Box>
                <Box width={6}>
                  <Text color="red">{e.kills}</Text>
                </Box>
                <Box width={6}>
                  <Text color="muted">{e.deaths}</Text>
                </Box>
                {isCurrent && <Text color="yellow">★</Text>}
              </Box>
            );
          })}
        </Box>
      )}

      <Box paddingY={1} />
      <Box alignItems="center">
        <Text color="muted" dimColor>[L] or [Esc] Return to Sector</Text>
      </Box>
    </Box>
  );
};

export default LeaderboardScreen;
