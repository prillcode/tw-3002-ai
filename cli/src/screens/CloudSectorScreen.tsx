import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Text, SectorMap, SectorList, SectorInfo, ShipStatus, ConfirmDialog, WarpTransition } from '../components';
import { NavigationScreen } from './NavigationScreen';
import { HelpScreen } from './HelpScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { useKeyHandler } from '../hooks';
import {
  cloudGetSectors,
  cloudGetSector,
  cloudGetShip,
  cloudCreateShip,
  cloudMoveShip,
  cloudTrade,
  cloudCombat,
  cloudUpgrade,
  cloudGetNews,
  type CloudAuth,
} from '../cloud/client';
import { BASE_PRICES, computeEffectiveStats, getAvailableUpgrades, getOwnedUpgrades } from '@tw3002/engine';
import type { Galaxy, Sector, Combatant, NPC, NewsItem } from '@tw3002/engine';

// ─── Types ─────────────────────────────────────────────────

interface CloudShipState {
  name: string;
  credits: number;
  cargo: { ore: number; organics: number; equipment: number };
  maxCargo: number;
  hull: number;
  maxHull: number;
  shield: number;
  maxShield: number;
  turns: number;
  maxTurns: number;
  classId: string;
  currentSector: number;
  upgrades: Record<string, number>;
}

export interface CloudSectorScreenProps {
  auth: CloudAuth;
  galaxyId: number;
  onQuit: () => void;
  onBack: () => void;
}

// ─── Helpers ───────────────────────────────────────────────

function buildGalaxyFromCloud(galaxyId: number, sectorsData: Array<any>): Galaxy {
  const sectors = new Map<number, Sector>();
  const connections: Array<{ from: number; to: number; type: 'warp' }> = [];
  const fedSpace: number[] = [];
  const stardocks: number[] = [];

  for (const row of sectorsData) {
    const id = row.sector_index;
    const port = row.port_class
      ? {
          name: row.port_name || `Port ${row.port_class}`,
          class: row.port_class as 1 | 2 | 3,
          trades: [], // rebuilt on demand from inventory
          inventory: { ore: 0, organics: 0, equipment: 0 },
          restockRate: 0,
        }
      : undefined;

    const sector: Sector = {
      id,
      name: row.name,
      coords: { x: 0, y: 0 }, // not stored in cloud
      port,
      danger: row.danger || 'safe',
      region: '',
    };

    sectors.set(id, sector);

    const conns: number[] = JSON.parse(row.connections_json || '[]');
    for (const to of conns) {
      connections.push({ from: id, to, type: 'warp' });
    }

    if (row.danger === 'safe') fedSpace.push(id);
    if (row.stardock === 1) stardocks.push(id);
  }

  return {
    id: `cloud-${galaxyId}`,
    seed: 0,
    sectors,
    connections,
    fedSpace,
    stardocks,
    createdAt: new Date().toISOString(),
  };
}

function getPortTrades(inventoryJson: string | null): Array<{ commodity: string; direction: 'buy' | 'sell'; basePrice: number }> {
  if (!inventoryJson) return [];
  const inv = JSON.parse(inventoryJson);
  const trades: Array<{ commodity: string; direction: 'buy' | 'sell'; basePrice: number }> = [];
  for (const [commodity, data] of Object.entries(inv)) {
    const d = data as { price: number; supply: number };
    trades.push({ commodity, direction: 'sell', basePrice: d.price });
  }
  return trades;
}

const MAX_VISIBLE_NEIGHBORS = 5;
const MAX_DISPLAY_NPCS = 3;
const MAX_DISPLAY_NEWS = 2;

// ─── Component ─────────────────────────────────────────────

export const CloudSectorScreen: React.FC<CloudSectorScreenProps> = ({
  auth,
  galaxyId,
  onQuit,
  onBack,
}) => {
  const [phase, setPhase] = useState<'loading' | 'createShip' | 'sector' | 'trade' | 'combat' | 'upgrades' | 'nav' | 'help' | 'leaderboard' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Galaxy data
  const [galaxy, setGalaxy] = useState<Galaxy | null>(null);
  const [ship, setShip] = useState<CloudShipState | null>(null);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sectorInventory, setSectorInventory] = useState<Record<string, { price: number; supply: number }> | null>(null);

  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [warpTarget, setWarpTarget] = useState<{ id: number; name: string } | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Trade state
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell' | null>(null);
  const [tradeCommodity, setTradeCommodity] = useState<string>('ore');
  const [tradeQuantity, setTradeQuantity] = useState(1);

  // Combat state
  const [combatEnemy, setCombatEnemy] = useState<NPC | null>(null);
  const [combatResult, setCombatResult] = useState<any>(null);
  const [combatSelectedAction, setCombatSelectedAction] = useState(0);

  // Upgrade state
  const [selectedUpgradeIndex, setSelectedUpgradeIndex] = useState(0);
  const [visitedSectorIds, setVisitedSectorIds] = useState<number[]>([]);

  // Terminal width
  const [termWidth, setTermWidth] = useState(process.stdout.columns ?? 120);
  useEffect(() => {
    const handler = () => setTermWidth(process.stdout.columns ?? 120);
    process.stdout.on('resize', handler);
    return () => { process.stdout.off('resize', handler); };
  }, []);
  const wideLayout = termWidth >= 100;

  // ─── Data Loading ──────────────────────────────────────

  const loadGalaxy = useCallback(async () => {
    try {
      const sectorsData = await cloudGetSectors(galaxyId);
      const g = buildGalaxyFromCloud(galaxyId, sectorsData.sectors);
      setGalaxy(g);
      return g;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load galaxy');
      setPhase('error');
      return null;
    }
  }, [galaxyId]);

  const loadShip = useCallback(async () => {
    try {
      const data = await cloudGetShip(galaxyId);
      const s = data.ship;
      const upgrades = JSON.parse(s.upgrades_json || '{}');
      const stats = computeEffectiveStats(s.class_id, upgrades);
      setShip({
        name: s.ship_name,
        credits: s.credits,
        cargo: JSON.parse(s.cargo_json || '{}'),
        maxCargo: stats.maxCargo,
        hull: s.hull,
        maxHull: stats.maxHull,
        shield: s.shield,
        maxShield: stats.shieldPoints,
        turns: s.turns,
        maxTurns: stats.maxTurns,
        classId: s.class_id,
        currentSector: s.current_sector,
        upgrades,
      });
      if (s.regenerated > 0) {
        setMessage(`⏳ +${s.regenerated} turns regenerated while away`);
      }
      return s;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('404') || msg.includes('not found')) {
        return null; // No ship yet — need to create
      }
      setError(msg || 'Failed to load ship');
      setPhase('error');
      return null;
    }
  }, [galaxyId]);

  const loadSector = useCallback(async (sectorId: number) => {
    try {
      const data = await cloudGetSector(galaxyId, sectorId);
      // Convert cloud NPCs to local NPC type
      const sectorNpcs: NPC[] = (data.npcs || []).map((n: any) => ({
        id: n.npc_id,
        persona: JSON.parse(n.persona_json),
        currentSectorId: n.current_sector,
        ship: JSON.parse(n.ship_json),
        credits: n.credits,
        cargo: JSON.parse(n.cargo_json || '{}'),
        memory: JSON.parse(n.memory_json || '{}'),
        isActive: true,
        turnsSinceSpawn: 0,
      }));
      setNpcs(sectorNpcs);

      // Parse port inventory
      const invJson = data.sector?.port_inventory_json;
      if (invJson && typeof invJson === 'string' && invJson !== '{}') {
        setSectorInventory(JSON.parse(invJson));
      } else {
        setSectorInventory(null);
      }
    } catch {
      setNpcs([]);
      setSectorInventory(null);
    }
  }, [galaxyId]);

  const loadNews = useCallback(async () => {
    try {
      const data = await cloudGetNews(galaxyId, 5);
      setNews(data.news.map((n: any) => ({
        headline: n.headline,
        type: n.type,
        timestamp: n.timestamp,
      })));
    } catch {
      setNews([]);
    }
  }, [galaxyId]);

  // Initial load
  useEffect(() => {
    async function init() {
      const g = await loadGalaxy();
      if (!g) return;
      const s = await loadShip();
      if (s === null) {
        setPhase('createShip');
        return;
      }
      await loadSector(s.current_sector);
      await loadNews();
      setVisitedSectorIds([s.current_sector]);
      setPhase('sector');
    }
    init();
  }, [loadGalaxy, loadShip, loadSector, loadNews]);

  // ─── Ship Creation ─────────────────────────────────────

  const [newShipName, setNewShipName] = useState('');
  const [newShipClass, setNewShipClass] = useState<'merchant' | 'scout' | 'interceptor'>('merchant');

  const handleCreateShip = async () => {
    if (!newShipName.trim()) return;
    try {
      await cloudCreateShip(galaxyId, newShipName.trim(), newShipClass);
      const s = await loadShip();
      if (s) {
        await loadSector(s.current_sector);
        await loadNews();
        setPhase('sector');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create ship');
      setPhase('error');
    }
  };

  // ─── Jump ──────────────────────────────────────────────

  const currentSector = galaxy?.sectors.get(ship?.currentSector ?? 0);
  const neighborIds = useMemo(() => {
    if (!galaxy || !ship) return [];
    return galaxy.connections
      .filter(c => c.from === ship.currentSector)
      .map(c => c.to);
  }, [galaxy, ship]);

  const neighbors = useMemo(() => {
    if (!galaxy) return [];
    return neighborIds.map(id => galaxy.sectors.get(id)).filter((s): s is Sector => s !== undefined);
  }, [neighborIds, galaxy]);

  const handleJump = () => {
    if (!ship || neighbors.length === 0 || ship.turns <= 0) return;
    const target = neighbors[selectedIndex];
    if (!target) return;
    setWarpTarget({ id: target.id, name: target.name });
    setIsWarping(true);
  };

  const completeJump = async () => {
    if (!warpTarget || !ship) return;
    try {
      await cloudMoveShip(galaxyId, warpTarget.id);
      setShip(prev => prev ? {
        ...prev,
        currentSector: warpTarget.id,
        turns: Math.max(0, prev.turns - 1),
        shield: prev.maxShield,
      } : null);
      setSelectedIndex(0);
      setScrollOffset(0);
      await loadSector(warpTarget.id);
      setVisitedSectorIds(prev => [...prev, warpTarget.id]);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Jump failed');
    }
    setIsWarping(false);
    setWarpTarget(null);
  };

  // ─── Trade ─────────────────────────────────────────────

  const currentInventory = useMemo(() => {
    return sectorInventory;
  }, [sectorInventory]);

  // For trade, we need to refetch sector to get current inventory
  const handleTrade = async () => {
    if (!ship || !currentSector) return;
    if (!tradeMode) {
      setTradeMode('buy');
      return;
    }

    // Client-side validation using displayed prices
    const inv = sectorInventory?.[tradeCommodity];
    if (!inv) {
      setMessage('Commodity not available at this port');
      return;
    }

    if (tradeMode === 'buy') {
      const cost = inv.price * tradeQuantity;
      const totalCargo = Object.values(ship.cargo).reduce((a, b) => a + b, 0);
      if (cost > ship.credits) {
        setMessage(`Not enough credits (need ${cost.toLocaleString()} cr)`);
        return;
      }
      if (inv.supply < tradeQuantity) {
        setMessage(`Port only has ${inv.supply} units`);
        return;
      }
      if (totalCargo + tradeQuantity > ship.maxCargo) {
        setMessage(`Not enough cargo space (${ship.maxCargo - totalCargo} free)`);
        return;
      }
    } else {
      const owned = ship.cargo[tradeCommodity as keyof typeof ship.cargo] ?? 0;
      if (owned < tradeQuantity) {
        setMessage(`You only have ${owned} units`);
        return;
      }
    }

    try {
      const result = await cloudTrade(galaxyId, currentSector.id, tradeCommodity, tradeQuantity, tradeMode);
      setShip(prev => {
        if (!prev) return null;
        const newCargo = { ...prev.cargo };
        if (tradeMode === 'buy') {
          newCargo[tradeCommodity as keyof typeof newCargo] = (newCargo[tradeCommodity as keyof typeof newCargo] ?? 0) + tradeQuantity;
        } else {
          newCargo[tradeCommodity as keyof typeof newCargo] = (newCargo[tradeCommodity as keyof typeof newCargo] ?? 0) - tradeQuantity;
        }
        return { ...prev, credits: result.remainingCredits, cargo: newCargo };
      });
      setMessage(`${tradeMode === 'buy' ? 'Bought' : 'Sold'} ${tradeQuantity} ${tradeCommodity} for ${tradeMode === 'buy' ? result.cost : result.revenue} cr`);
      await loadSector(currentSector.id);
      setTradeMode(null);
      setPhase('sector');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Trade failed');
    }
  };

  // ─── Combat ────────────────────────────────────────────

  const handleCombatAction = async (action: 'attack' | 'flee' | 'bribe') => {
    if (!ship || !currentSector || !combatEnemy) return;
    try {
      const res = await cloudCombat(galaxyId, currentSector.id, combatEnemy.id, action);
      const r = res.result;
      setCombatResult(r);

      // Use server-generated narrative
      const narrative = res.narrative ?? 'The encounter ends in silence.';

      if (r.destroyed) {
        setShip(prev => prev ? {
          ...prev,
          credits: Math.floor(prev.credits * 0.9),
          hull: prev.maxHull,
          shield: 0,
          cargo: { ore: 0, organics: 0, equipment: 0 },
          currentSector: galaxy?.fedSpace[0] ?? 0,
        } : null);
        setVisitedSectorIds(prev => [...prev, -1]);
        setMessage(`💥 ${narrative} Respawned in FedSpace with ${Math.floor(ship.credits * 0.9).toLocaleString()} cr`);
      } else if (r.fled) {
        if (r.playerHullRemaining < ship.hull) {
          setShip(prev => prev ? { ...prev, hull: r.playerHullRemaining, shield: prev.maxShield } : null);
          setMessage(`🏃 ${narrative}`);
        } else {
          setMessage(`🏃 ${narrative}`);
        }
      } else if (r.bribed) {
        setShip(prev => prev ? {
          ...prev,
          credits: prev.credits - r.creditsLost,
          shield: prev.maxShield,
        } : null);
        setMessage(`💰 ${narrative}`);
      } else if (r.won) {
        setShip(prev => prev ? {
          ...prev,
          hull: r.playerHullRemaining,
          shield: prev.maxShield,
          credits: prev.credits + r.creditsGained,
        } : null);
        setMessage(`⚔ ${narrative}`);
        setNpcs(prev => prev.filter(n => n.id !== combatEnemy.id));
      } else {
        // Survived but didn't win (draw or enemy fled — edge case)
        setShip(prev => prev ? {
          ...prev,
          hull: r.playerHullRemaining,
          shield: prev.maxShield,
        } : null);
        setMessage(`⚔ ${narrative}`);
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Combat failed');
    }
    setCombatEnemy(null);
    setCombatSelectedAction(0);
  };

  // ─── Upgrade ───────────────────────────────────────────

  const handleUpgradePurchase = async () => {
    if (!ship || !currentSector) return;
    const available = getAvailableUpgrades(ship.upgrades);
    const upgrade = available[selectedUpgradeIndex];
    if (!upgrade) return;

    try {
      const result = await cloudUpgrade(galaxyId, currentSector.id, upgrade.id);
      setShip(prev => {
        if (!prev) return null;
        return {
          ...prev,
          credits: result.remainingCredits,
          maxCargo: result.stats.maxCargo,
          maxHull: result.stats.maxHull,
          maxShield: result.stats.shieldPoints,
          maxTurns: result.stats.maxTurns,
          upgrades: { ...prev.upgrades, [upgrade.id]: 1 },
        };
      });
      setMessage(`⚡ Purchased ${upgrade.name}!`);
      setPhase('sector');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Upgrade failed');
    }
  };

  // ─── Keyboard ──────────────────────────────────────────

  useKeyHandler({
    onUp: () => {
      if (phase === 'trade' && tradeMode) {
        setTradeQuantity(q => Math.max(1, q - 1));
        return;
      }
      if (phase === 'combat') {
        setCombatSelectedAction(i => (i > 0 ? i - 1 : 2));
        return;
      }
      if (phase === 'upgrades') {
        setSelectedUpgradeIndex(i => Math.max(0, i - 1));
        return;
      }
      setSelectedIndex(prev => {
        const next = prev > 0 ? prev - 1 : prev;
        setScrollOffset(so => Math.min(so, next));
        return next;
      });
    },
    onDown: () => {
      if (phase === 'trade' && tradeMode) {
        setTradeQuantity(q => q + 1);
        return;
      }
      if (phase === 'combat') {
        setCombatSelectedAction(i => (i < 2 ? i + 1 : 0));
        return;
      }
      if (phase === 'upgrades') {
        const availableCount = getAvailableUpgrades(ship?.upgrades ?? {}).length;
        setSelectedUpgradeIndex(i => Math.min(availableCount - 1, i + 1));
        return;
      }
      setSelectedIndex(prev => {
        const next = prev < neighbors.length - 1 ? prev + 1 : prev;
        if (next >= scrollOffset + MAX_VISIBLE_NEIGHBORS) {
          setScrollOffset(next - MAX_VISIBLE_NEIGHBORS + 1);
        }
        return next;
      });
    },
    onReturn: () => {
      if (phase === 'createShip') {
        handleCreateShip();
        return;
      }
      if (phase === 'trade') {
        handleTrade();
        return;
      }
      if (phase === 'combat') {
        const actions: Array<'attack' | 'flee' | 'bribe'> = ['attack', 'flee', 'bribe'];
        const action = actions[combatSelectedAction];
        if (action) handleCombatAction(action);
        return;
      }
      if (phase === 'upgrades') {
        handleUpgradePurchase();
        return;
      }
      handleJump();
    },
    onM: () => {
      if (phase === 'sector' && currentSector?.port) {
        setTradeMode('buy');
        setPhase('trade');
      }
    },
    onN: () => {
      if (phase === 'sector') {
        setPhase('nav');
      }
    },
    onH: () => {
      if (phase === 'sector') {
        setPhase('help');
      }
    },
    onL: () => {
      if (phase === 'sector') {
        setPhase('leaderboard');
      }
    },
    onD: () => {
      if (phase === 'sector' && galaxy?.stardocks.includes(ship?.currentSector ?? -1)) {
        setSelectedUpgradeIndex(0);
        setPhase('upgrades');
      }
    },
    onB: () => {
      if (phase === 'trade') {
        setTradeMode('buy');
      }
    },
    onS: () => {
      if (phase === 'trade') {
        setTradeMode('sell');
      }
    },
    onEscape: () => {
      if (phase === 'trade') {
        setTradeMode(null);
        setPhase('sector');
        return;
      }
      if (phase === 'combat') {
        setCombatEnemy(null);
        setCombatResult(null);
        setPhase('sector');
        return;
      }
      if (phase === 'upgrades') {
        setPhase('sector');
        return;
      }
      if (phase === 'nav') {
        setPhase('sector');
        return;
      }
      if (phase === 'help') {
        setPhase('sector');
        return;
      }
      if (phase === 'leaderboard') {
        setPhase('sector');
        return;
      }
      onBack();
    },
    onQ: () => setShowQuitConfirm(true),
  });

  // ─── Render Loading ────────────────────────────────────

  if (phase === 'loading') {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Text color="cyan" bold>🌌 Connecting to The Void...</Text>
      </Box>
    );
  }

  if (phase === 'error') {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Text color="red" bold>Connection Error</Text>
        <Text color="white">{error}</Text>
        <Box marginTop={1}>
          <Text color="muted" dimColor>[Esc] Back</Text>
        </Box>
      </Box>
    );
  }

  // ─── Render Ship Creation ──────────────────────────────

  if (phase === 'createShip') {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
        <Box borderStyle="double" borderColor="cyan" paddingX={3} paddingY={1} marginBottom={2}>
          <Text color="cyan" bold>CREATE YOUR SHIP</Text>
        </Box>

        <Box marginY={1} flexDirection="column" alignItems="center">
          <Text color="white">Ship Name:</Text>
          <Text color="yellow">{newShipName}</Text>
          <Text color="muted" dimColor>_</Text>
        </Box>

        <Box marginY={1} flexDirection="column">
          <Text color="white">Class:</Text>
          {(['merchant', 'scout', 'interceptor'] as const).map((c, i) => (
            <Text key={c} color={newShipClass === c ? 'yellow' : 'muted'} bold={newShipClass === c}>
              {newShipClass === c ? '> ' : '  '}{c}
            </Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="muted" dimColor>[Enter] Launch  [Esc] Back</Text>
        </Box>
      </Box>
    );
  }

  // ─── Render Warp ───────────────────────────────────────

  if (isWarping && warpTarget) {
    return (
      <WarpTransition
        targetSector={warpTarget.id}
        sectorName={warpTarget.name}
        onComplete={completeJump}
        duration={2000}
      />
    );
  }

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

  // ─── Render Trade Overlay ──────────────────────────────

  if (phase === 'trade' && tradeMode && ship && currentSector) {
    const commodities = ['ore', 'organics', 'equipment'];
    const totalCargo = Object.values(ship.cargo).reduce((a, b) => a + b, 0);

    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="yellow" paddingX={2} paddingY={1}>
          <Text color="yellow" bold>
            {tradeMode === 'buy' ? 'BUY' : 'SELL'} — {currentSector.name}
          </Text>
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="column">
          {commodities.map(c => {
            const inv = sectorInventory?.[c];
            const owned = ship.cargo[c as keyof typeof ship.cargo] ?? 0;
            const basePrice = (BASE_PRICES as Record<string, number>)[c] ?? 0;
            const price = inv?.price ?? 0;
            const profitIndicator = owned > 0
              ? price > basePrice ? '▲' : price < basePrice ? '▼' : '—'
              : '';
            const profitColor = price > basePrice ? 'green' : price < basePrice ? 'red' : 'muted';

            return (
              <Box key={c} flexDirection="row" gap={2}>
                <Text color={tradeCommodity === c ? 'yellow' : 'white'} bold={tradeCommodity === c}>
                  {tradeCommodity === c ? '> ' : '  '}{c}
                </Text>
                <Text color="cyan">{price > 0 ? `${price} cr` : '—'}</Text>
                <Text color="muted">Sup:{inv?.supply ?? 0}</Text>
                <Text color="muted">Own:{owned}</Text>
                {owned > 0 && (
                  <Text color={profitColor}>{profitIndicator}</Text>
                )}
              </Box>
            );
          })}
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="row" gap={2}>
          <Text color="white">Quantity: </Text>
          <Text color="yellow" bold>{tradeQuantity}</Text>
          {tradeMode === 'buy' && sectorInventory?.[tradeCommodity] && (
            <Text color="muted">Cost: {(sectorInventory[tradeCommodity].price * tradeQuantity).toLocaleString()} cr</Text>
          )}
          {tradeMode === 'sell' && sectorInventory?.[tradeCommodity] && (
            <Text color="muted">Revenue: {(sectorInventory[tradeCommodity].price * tradeQuantity).toLocaleString()} cr</Text>
          )}
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="row" gap={2}>
          <Text color="cyan">Credits: {ship.credits.toLocaleString()}</Text>
          <Text color="muted">Cargo: {totalCargo}/{ship.maxCargo}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="muted" dimColor>[↑↓] Select  [B] Buy  [S] Sell  [Enter] Confirm  [Esc] Back</Text>
        </Box>
      </Box>
    );
  }

  // ─── Render Combat ─────────────────────────────────────

  if (phase === 'combat' && combatEnemy && ship) {
    const enemyShip = combatEnemy.ship;
    const actions = ['Attack', 'Flee', 'Bribe'];

    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="red" paddingX={2} paddingY={1}>
          <Text color="red" bold>⚔ COMBAT — {combatEnemy.persona.name}</Text>
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="row" gap={3}>
          <Box flexDirection="column">
            <Text color="cyan" bold>Your Ship</Text>
            <Text color="white">Hull: {ship.hull}/{ship.maxHull}</Text>
            <Text color="white">Shield: {ship.shield}/{ship.maxShield}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color="red" bold>Enemy</Text>
            <Text color="white">Hull: {enemyShip.hull}/{enemyShip.maxHull}</Text>
            <Text color="white">Shield: {enemyShip.shield}/{enemyShip.maxShield}</Text>
          </Box>
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="column">
          {actions.map((a, i) => (
            <Text key={a} color={combatSelectedAction === i ? 'yellow' : 'white'} bold={combatSelectedAction === i}>
              {combatSelectedAction === i ? '> ' : '  '}{a}
            </Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text color="muted" dimColor>[↑↓] Select  [Enter] Confirm</Text>
        </Box>
      </Box>
    );
  }

  // ─── Render Upgrades ─────────────────────────────────

  if (phase === 'upgrades' && ship && currentSector) {
    const isDock = galaxy?.stardocks.includes(currentSector.id) ?? false;
    if (!isDock) {
      setPhase('sector');
      return null;
    }

    const available = getAvailableUpgrades(ship.upgrades);
    const owned = getOwnedUpgrades(ship.upgrades);

    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="double" borderColor="magenta" paddingX={2} paddingY={1}>
          <Text color="magenta" bold>⚡ STARDOCK — {currentSector.name}</Text>
        </Box>

        <Box paddingY={1} />

        {owned.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color="cyan" bold>Installed Upgrades</Text>
            {owned.map(u => (
              <Text key={u.id} color="muted">  {u.name}</Text>
            ))}
          </Box>
        )}

        <Box flexDirection="column">
          <Text color="yellow" bold>Available Upgrades</Text>
          {available.length === 0 && (
            <Text color="muted">No upgrades available</Text>
          )}
          {available.map((u, i) => (
            <Box key={u.id} flexDirection="row" gap={2}>
              <Text color={selectedUpgradeIndex === i ? 'yellow' : 'white'} bold={selectedUpgradeIndex === i}>
                {selectedUpgradeIndex === i ? '> ' : '  '}{u.name}
              </Text>
              <Text color="cyan">{u.cost.toLocaleString()} cr</Text>
              <Text color="muted">— {u.description}</Text>
            </Box>
          ))}
        </Box>

        <Box paddingY={1} />

        <Box flexDirection="row" gap={2}>
          <Text color="cyan">Credits: {ship.credits.toLocaleString()}</Text>
        </Box>

        <Box marginTop={1}>
          <Text color="muted" dimColor>[↑↓] Select  [Enter] Purchase  [Esc] Back</Text>
        </Box>
      </Box>
    );
  }

  // ─── Render Navigation ───────────────────────────────

  if (phase === 'nav' && galaxy && ship) {
    return (
      <NavigationScreen
        galaxy={galaxy}
        visitedIds={visitedSectorIds}
        currentSectorId={ship.currentSector}
        startingSectorId={visitedSectorIds[0] ?? ship.currentSector}
        onBack={() => setPhase('sector')}
      />
    );
  }

  // ─── Render Help ─────────────────────────────────────

  if (phase === 'help') {
    return (
      <HelpScreen
        context="cloud"
        onBack={() => setPhase('sector')}
      />
    );
  }

  // ─── Render Leaderboard ────────────────────────────────

  if (phase === 'leaderboard') {
    return (
      <LeaderboardScreen
        auth={auth}
        galaxyId={galaxyId}
        currentPlayerEmail={auth.email}
        onBack={() => setPhase('sector')}
      />
    );
  }

  // ─── Render Sector View ────────────────────────────────

  if (!galaxy || !ship || !currentSector) {
    return (
      <Box flexDirection="column" alignItems="center" padding={2}>
        <Text color="red">Failed to load sector data</Text>
      </Box>
    );
  }

  const visibleNeighbors = neighbors.slice(scrollOffset, scrollOffset + MAX_VISIBLE_NEIGHBORS);
  const showScrollUp = scrollOffset > 0;
  const showScrollDown = scrollOffset + MAX_VISIBLE_NEIGHBORS < neighbors.length;
  const selectedSector = neighbors[selectedIndex];
  const displayNpcs = npcs.slice(0, MAX_DISPLAY_NPCS);
  const extraNpcCount = npcs.length - MAX_DISPLAY_NPCS;
  const displayNews = news.slice(-MAX_DISPLAY_NEWS);

  const statusMessages: string[] = [];
  if (ship.turns === 0) statusMessages.push('OUT OF TURNS');
  else if (ship.turns <= 20) statusMessages.push(`LOW TURNS: ${ship.turns}`);

  return (
    <Box flexDirection="column" padding={1}>
      <SectorInfo sector={currentSector} isStarDock={galaxy?.stardocks.includes(currentSector.id) ?? false} />

      <Box paddingY={1} />

      {wideLayout ? (
        <Box flexDirection="row" justifyContent="space-between" gap={1}>
          <Box flexDirection="column" minWidth={30}>
            <ShipStatus
              shipName={ship.name}
              credits={ship.credits}
              cargo={ship.cargo}
              maxCargo={ship.maxCargo}
              hull={ship.hull}
              maxHull={ship.maxHull}
              shield={ship.shield}
              maxShield={ship.maxShield}
              turns={ship.turns}
              maxTurns={ship.maxTurns}
              currentSector={ship.currentSector}
            />
          </Box>
          <Box flexDirection="column" minWidth={30}>
            {showScrollUp && <Text color="muted" dimColor> ▲ {scrollOffset} more</Text>}
            <SectorList
              sectors={visibleNeighbors}
              selectedIndex={selectedIndex - scrollOffset}
              stardockIds={galaxy?.stardocks ?? []}
            />
            {showScrollDown && <Text color="muted" dimColor> ▼ {neighbors.length - scrollOffset - MAX_VISIBLE_NEIGHBORS} more</Text>}
          </Box>
          <Box flexDirection="column" flexGrow={1}>
            <SectorMap
              currentSector={currentSector}
              neighbors={neighbors}
              selectedIndex={selectedIndex}
            />
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box flexDirection="row" justifyContent="space-between" gap={1}>
            <Box flexDirection="column" minWidth={30}>
              <ShipStatus
                shipName={ship.name}
                credits={ship.credits}
                cargo={ship.cargo}
                maxCargo={ship.maxCargo}
                hull={ship.hull}
                maxHull={ship.maxHull}
                shield={ship.shield}
                maxShield={ship.maxShield}
                turns={ship.turns}
                maxTurns={ship.maxTurns}
                currentSector={ship.currentSector}
              />
            </Box>
            <Box flexDirection="column" minWidth={30}>
              {showScrollUp && <Text color="muted" dimColor> ▲ {scrollOffset} more</Text>}
              <SectorList
                sectors={visibleNeighbors}
                selectedIndex={selectedIndex - scrollOffset}
                stardockIds={galaxy?.stardocks ?? []}
              />
              {showScrollDown && <Text color="muted" dimColor> ▼ {neighbors.length - scrollOffset - MAX_VISIBLE_NEIGHBORS} more</Text>}
            </Box>
          </Box>
          <Box marginTop={1} flexGrow={1}>
            <SectorMap
              currentSector={currentSector}
              neighbors={neighbors}
              selectedIndex={selectedIndex}
            />
          </Box>
        </Box>
      )}

      <Box paddingY={1} />

      <Box borderStyle="single" borderColor={selectedSector ? 'green' : 'muted'} paddingX={2} paddingY={0} alignItems="center">
        {selectedSector ? (
          <Text>
            <Text color="cyan">Selected: </Text>
            <Text bold>Sector {selectedSector.id}</Text>
            <Text color="muted"> — {selectedSector.name}</Text>
            {selectedSector.port && <Text color="yellow"> (Port Class {selectedSector.port.class})</Text>}
            <Text color="green"> — [Enter] Jump (1 turn)</Text>
          </Text>
        ) : (
          <Text color="muted">No warp lanes available</Text>
        )}
      </Box>

      <Box marginTop={0} paddingY={0} alignItems="center">
        {statusMessages.length > 0 ? (
          <Text>
            {statusMessages.map((msg, i) => (
              <Text key={i} color={msg.includes('OUT') ? 'red' : 'yellow'} bold>
                {i > 0 && ' · '}{msg.includes('OUT') ? `⚠ ${msg}` : `⚠ ${msg}`}
              </Text>
            ))}
          </Text>
        ) : (
          <Text color="muted" dimColor> </Text>
        )}
      </Box>

      {message && (
        <Box marginTop={0} borderStyle="single" borderColor="yellow" paddingX={1} paddingY={0}>
          <Text color="yellow">{message}</Text>
        </Box>
      )}

      <Box marginTop={0} flexDirection="column">
        {displayNpcs.map(npc => (
          <Box key={npc.id} flexDirection="row" gap={1}>
            <Text
              color={
                npc.persona.type === 'raider' ? 'red' :
                npc.persona.type === 'patrol' ? 'green' :
                'cyan'
              }
            >
              {npc.persona.type === 'raider' ? '⚠️ ' :
               npc.persona.type === 'patrol' ? '🛡️ ' :
               '📦 '}
              {npc.persona.name}
              <Text color="muted" dimColor> — {npc.persona.type}</Text>
            </Text>
          </Box>
        ))}
        {extraNpcCount > 0 && (
          <Text color="muted" dimColor>… and {extraNpcCount} more</Text>
        )}
      </Box>

      {displayNews.length > 0 && (
        <Box marginTop={0} borderStyle="single" borderColor="muted" paddingX={1} paddingY={0} flexDirection="column">
          {displayNews.map((item, i) => (
            <Text key={i} color="muted" dimColor>• {item.headline}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CloudSectorScreen;
