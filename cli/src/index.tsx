import React, { useState, useEffect, useMemo } from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout, ConfirmDialog } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen, SlotSelectScreen, GalaxySizeScreen, StarDockScreen, ShipClassSelectScreen, CombatScreen } from './screens';
import { initDatabase, saveGame, loadGame, hasSave, clearSave, type GameState, type Database } from './db';
import { createGalaxy, getShipClass, computeEffectiveStats, UPGRADE_CATALOG, generateNPCs, tickNPCs, GameStateContainer, loadConfig, addGrudge, updateReputation, addMarketObservation, type Galaxy, type Combatant, type CombatResult, type NPC, type NewsItem, type GameState as EngineGameState, type TickStats } from '@tw3002/engine';

type AppMode = 'welcome' | 'slotSelect' | 'galaxySize' | 'shipName' | 'shipClass' | 'sector' | 'market' | 'stardock' | 'combat';
type SelectMode = 'new' | 'continue' | null;

/**
 * Serialize a Galaxy to JSON (convert Map to array for storage).
 */
function galaxyToJson(galaxy: Galaxy): string {
  return JSON.stringify({
    ...galaxy,
    sectors: Object.fromEntries(galaxy.sectors),
  });
}

/**
 * Deserialize a Galaxy from JSON (convert object back to Map).
 */
function galaxyFromJson(json: string): Galaxy {
  const raw = JSON.parse(json);
  return {
    ...raw,
    sectors: new Map(Object.entries(raw.sectors).map(([k, v]) => [Number(k), v])),
  };
}

const App = () => {
  const { currentScreen, navigateTo, goBack } = useScreen({ initial: 'welcome' });
  const db = useMemo(() => initDatabase(), []);
  
  // Track current mode/flow
  const [appMode, setAppMode] = useState<AppMode>('welcome');
  const [selectMode, setSelectMode] = useState<SelectMode>(null);
  
  // Selected slot for gameplay
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  
  // Galaxy state
  const [galaxy, setGalaxy] = useState<Galaxy | null>(null);
  
  // Ship state
  const [shipName, setShipName] = useState<string>('');
  const [shipClassId, setShipClassId] = useState<string>('merchant');
  const [upgrades, setUpgrades] = useState<Record<string, number>>({});
  const [currentSectorId, setCurrentSectorId] = useState<number>(0);
  const [shipState, setShipState] = useState({
    credits: 5000,
    cargo: { ore: 0, organics: 0, equipment: 0 },
    maxCargo: 120,
    hull: 100,
    shield: 0,
    maxShield: 0,
    turns: 80,
    maxTurns: 80
  });

  // Combat state
  const [combatEnemy, setCombatEnemy] = useState<Combatant | null>(null);

  // NPC state
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tickStats, setTickStats] = useState<TickStats | null>(null);
  
  // Confirmation dialogs
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  // Compute effective stats from class + upgrades
  const effectiveStats = useMemo(
    () => computeEffectiveStats(shipClassId, upgrades),
    [shipClassId, upgrades]
  );

  // Compute net worth: credits + cargo value + upgrade value
  const netWorth = useMemo(() => {
    const cargoValue = (shipState.cargo.ore * 100) + (shipState.cargo.organics * 50) + (shipState.cargo.equipment * 200);
    const upgradeValue = Object.keys(upgrades).reduce((sum, id) => {
      const upgrade = UPGRADE_CATALOG.find(u => u.id === id);
      return sum + (upgrade?.cost ?? 0);
    }, 0);
    return shipState.credits + cargoValue + upgradeValue;
  }, [shipState.credits, shipState.cargo, upgrades]);

  // Auto-save whenever state changes
  useEffect(() => {
    if (shipName && selectedSlot && galaxy) {
      const gameState: GameState = {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        shield: shipState.shield,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns,
        shipClassId,
        upgradesJson: JSON.stringify(upgrades),
        galaxyJson: galaxyToJson(galaxy),
        npcsJson: JSON.stringify(npcs),
      };
      saveGame(db, selectedSlot, gameState);
    }
  }, [shipName, currentSectorId, shipState, selectedSlot, galaxy, db, shipClassId, upgrades, npcs]);

  // Handle New Game request
  const handleNewGame = () => {
    setSelectMode('new');
    setAppMode('slotSelect');
  };
  
  // Handle Continue request
  const handleContinue = () => {
    setSelectMode('continue');
    setAppMode('slotSelect');
  };
  
  // Handle slot selection
  const handleSelectSlot = async (slotId: number, isEmpty: boolean) => {
    setSelectedSlot(slotId);
    
    if (selectMode === 'new') {
      if (isEmpty) {
        setAppMode('galaxySize');
      } else {
        setPendingSlot(slotId);
        setShowNewGameConfirm(true);
      }
    } else if (selectMode === 'continue') {
      await loadExistingGame(slotId);
    }
  };
  
  // Start fresh game — generate galaxy + NPCs, then pick ship class
  const startNewGame = (slotId: number, sectorCount: number = 100) => {
    clearSave(db, slotId);
    const newGalaxy = createGalaxy({ seed: Date.now(), sectorCount });
    const newNpcs = generateNPCs(newGalaxy, 20, Date.now() + 1);
    setGalaxy(newGalaxy);
    setNpcs(newNpcs);
    setNews([{
      timestamp: new Date().toISOString(),
      headline: 'Welcome to a new galaxy, Commander!',
      type: 'event',
    }]);
    setShipName('');
    setCurrentSectorId(0);
    setUpgrades({});
    // Don't set shipState yet — wait for class selection
    setAppMode('shipName');
  };
  
  // After ship name, pick class
  const handleShipNameSubmit = (name: string) => {
    setShipName(name);
    setAppMode('shipClass');
  };

  // After class selection, set starting stats and enter game
  const handleClassSelect = async (classId: string) => {
    const shipClass = getShipClass(classId);
    const stats = shipClass?.baseStats ?? getShipClass('merchant')!.baseStats;
    setShipClassId(classId);
    setShipState({
      credits: 5000,
      cargo: { ore: 0, organics: 0, equipment: 0 },
      maxCargo: stats.maxCargo,
      hull: stats.maxHull,
      shield: stats.shieldPoints,
      maxShield: stats.shieldPoints,
      turns: stats.maxTurns,
      maxTurns: stats.maxTurns,
    });

    // Tick NPCs before entering sector (galaxy evolves while player was away)
    if (galaxy && npcs.length > 0) {
      const playerShip: EngineGameState['player'] = {
        name: shipName,
        classId,
        credits: 5000,
        currentSector: currentSectorId,
        cargo: { ore: 0, organics: 0, equipment: 0 },
        hull: stats.maxHull,
        shield: stats.shieldPoints,
        turns: stats.maxTurns,
        maxTurns: stats.maxTurns,
        upgrades: {},
      };

      const gameState: EngineGameState = {
        galaxy,
        player: playerShip,
        currentSectorId,
        turnsUsed: 0,
        turnsRegenRate: 1,
        lastPlayedAt: new Date().toISOString(),
        combatLog: [],
        tradeLog: [],
        npcs,
        news,
      };

      const container = new GameStateContainer(gameState);
      const llmConfig = loadConfig();
      try {
        const result = await tickNPCs(container, llmConfig);
        setGalaxy(result.container.galaxy);
        setNpcs(result.container.npcs);
        setNews(prev => [...prev, ...result.news]);
        setTickStats(result.stats);
      } catch {
        // If tick fails, proceed without it
      }
    }

    setAppMode('sector');
  };

  // Confirm overwrite
  const confirmOverwrite = () => {
    if (pendingSlot) {
      setSelectedSlot(pendingSlot);
      setShowNewGameConfirm(false);
      setPendingSlot(null);
      setAppMode('galaxySize');
    }
  };
  
  // Load existing game from slot
  const loadExistingGame = async (slotId: number) => {
    const save = loadGame(db, slotId);
    if (save) {
      const loadedClassId = save.shipClassId ?? 'merchant';
      const loadedUpgrades = save.upgradesJson ? JSON.parse(save.upgradesJson) : {};
      
      // Compute effective stats for maxCargo
      const stats = computeEffectiveStats(loadedClassId, loadedUpgrades);
      
      const loadedGalaxy = save.galaxyJson ? galaxyFromJson(save.galaxyJson) : createGalaxy({ seed: 42 });
      let loadedNpcs: NPC[] = [];
      if (save.npcsJson) {
        try {
          loadedNpcs = JSON.parse(save.npcsJson);
        } catch {
          loadedNpcs = [];
        }
      }

      // Set all state at once
      setShipName(save.shipName);
      setCurrentSectorId(save.currentSector);
      setShipClassId(loadedClassId);
      setUpgrades(loadedUpgrades);
      setShipState({
        credits: save.credits,
        cargo: save.cargo,
        maxCargo: stats.maxCargo,
        hull: save.hull,
        shield: save.shield ?? stats.shieldPoints,
        maxShield: stats.shieldPoints,
        turns: save.turns,
        maxTurns: save.maxTurns,
      });
      setSelectedSlot(slotId);
      setGalaxy(loadedGalaxy);
      setNpcs(loadedNpcs);

      // Tick NPCs — galaxy evolves while player was away
      if (loadedNpcs.length > 0) {
        const playerShip: EngineGameState['player'] = {
          name: save.shipName,
          classId: loadedClassId,
          credits: save.credits,
          currentSector: save.currentSector,
          cargo: save.cargo,
          hull: save.hull,
          shield: save.shield ?? stats.shieldPoints,
          turns: save.turns,
          maxTurns: save.maxTurns,
          upgrades: loadedUpgrades,
        };

        const gameState: EngineGameState = {
          galaxy: loadedGalaxy,
          player: playerShip,
          currentSectorId: save.currentSector,
          turnsUsed: 0,
          turnsRegenRate: 1,
          lastPlayedAt: new Date().toISOString(),
          combatLog: [],
          tradeLog: [],
          npcs: loadedNpcs,
          news: [],
        };

        const container = new GameStateContainer(gameState);
        const llmConfig = loadConfig();
        try {
          const result = await tickNPCs(container, llmConfig);
          setGalaxy(result.container.galaxy);
          setNpcs(result.container.npcs);
          setNews(prev => [...prev, ...result.news]);
          setTickStats(result.stats);
        } catch {
          // If tick fails, proceed without it
        }
      }
      
      setAppMode('sector');
    }
  };
  
  // Handle quit
  const handleQuit = () => {
    if (shipName && selectedSlot && galaxy) {
      saveGame(db, selectedSlot, {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        shield: shipState.shield,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns,
        shipClassId,
        upgradesJson: JSON.stringify(upgrades),
        galaxyJson: galaxyToJson(galaxy),
      });
    }
    process.exit(0);
  };

  // Handle combat encounter
  const handleCombatStart = (enemy: Combatant) => {
    setCombatEnemy(enemy);
    setAppMode('combat');
  };

  // Check for NPC raiders in sector before random encounter
  const handleJumpComplete = (sectorId: number) => {
    const sector = galaxy?.sectors.get(sectorId);
    if (!sector) return;

    // Check for raider NPCs in this sector
    const raiders = npcs.filter(n => n.currentSectorId === sectorId && n.persona.type === 'raider');
    if (raiders.length > 0) {
      // Pick a random raider to attack
      const raider = raiders[Math.floor(Math.random() * raiders.length)];
      if (raider && Math.random() < raider.persona.aggression * 0.8) {
        const { npcToCombatant } = require('@tw3002/engine');
        setCombatEnemy(npcToCombatant(raider));
        setAppMode('combat');
        return;
      }
    }

    // Fallback to random encounter
    const { rollEncounter } = require('@tw3002/engine');
    const enemy = rollEncounter(sector, Date.now());
    if (enemy) {
      setCombatEnemy(enemy);
      setAppMode('combat');
    }
  };

  // Apply combat result
  const handleCombatEnd = (result: CombatResult) => {
    const stats = computeEffectiveStats(shipClassId, upgrades);

    if (result.playerDestroyed) {
      // Respawn in FedSpace
      const fedCenter = galaxy?.fedSpace[0] ?? 0;
      setCurrentSectorId(fedCenter);
      setShipState(prev => ({
        ...prev,
        credits: Math.floor(prev.credits * 0.9),
        hull: stats.maxHull,
        shield: stats.shieldPoints,
      }));
    } else {
      // Apply damage and credit changes
      setShipState(prev => ({
        ...prev,
        credits: prev.credits + result.creditsGained - result.creditsLost,
        hull: result.hullRemaining,
        shield: result.shieldRemaining,
      }));
    }

    // Update NPC memory if this was an NPC fight
    if (combatEnemy?.npcId) {
      setNpcs(prev => prev.map(npc => {
        if (npc.id !== combatEnemy.npcId) return npc;

        if (result.victory) {
          // Player won → NPC holds a grudge
          let updated = addGrudge(npc, 'player', shipName || 'Player', 'Defeated me in combat', 7);
          updated = updateReputation(updated, 'player', shipName || 'Player', -15);
          return updated;
        }
        if (result.fled) {
          // Player fled → NPC feels confident
          let updated = addGrudge(npc, 'player', shipName || 'Player', 'Ran from our fight', 3);
          updated = updateReputation(updated, 'player', shipName || 'Player', -5);
          return updated;
        }
        if (result.playerDestroyed) {
          // NPC won → feels dominant, no grudge
          return updateReputation(npc, 'player', shipName || 'Player', 10);
        }
        return npc;
      }));
    }

    setCombatEnemy(null);
    setAppMode('sector');
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (appMode === 'slotSelect') {
      setAppMode('welcome');
      setSelectMode(null);
    } else if (appMode === 'galaxySize') {
      setAppMode('slotSelect');
    } else if (appMode === 'shipName') {
      setAppMode('galaxySize');
    } else if (appMode === 'shipClass') {
      setAppMode('shipName');
    } else if (appMode === 'sector') {
      setAppMode('welcome');
    } else if (appMode === 'market') {
      setAppMode('sector');
    } else if (appMode === 'stardock') {
      setAppMode('sector');
    }
  };

  // Render based on current mode
  const renderContent = () => {
    switch (appMode) {
      case 'welcome':
        return (
          <WelcomeScreen
            onNewGame={handleNewGame}
            onContinue={handleContinue}
            onQuit={handleQuit}
            db={db}
          />
        );
        
      case 'slotSelect':
        if (!selectMode) return null;
        return (
          <SlotSelectScreen
            db={db}
            mode={selectMode}
            onSelectSlot={handleSelectSlot}
            onBack={handleBack}
          />
        );
        
      case 'galaxySize':
        return (
          <GalaxySizeScreen
            onSelect={(sectorCount) => {
              startNewGame(selectedSlot, sectorCount);
            }}
            onBack={handleBack}
          />
        );
        
      case 'shipName':
        return (
          <WelcomeScreen
            onNewGame={handleShipNameSubmit}
            onQuit={handleQuit}
            db={db}
            skipToShipName
          />
        );

      case 'shipClass':
        return (
          <ShipClassSelectScreen
            onSelect={handleClassSelect}
            onBack={handleBack}
          />
        );
        
      case 'sector':
        if (!galaxy) return null;
        return (
          <SectorScreen
            onMarket={() => setAppMode('market')}
            onStarDock={() => setAppMode('stardock')}
            onCombat={handleCombatStart}
            onJumpComplete={handleJumpComplete}
            onBack={handleBack}
            shipName={shipName || 'Unnamed Vessel'}
            currentSectorId={currentSectorId}
            onUpdateSector={setCurrentSectorId}
            shipState={{ ...shipState, name: shipName }}
            netWorth={netWorth}
            npcs={npcs.filter(n => n.currentSectorId === currentSectorId)}
            news={news.slice(-5)}
            onUpdateShip={(newState) => {
              setShipState(prev => ({
                ...prev,
                credits: newState.credits,
                cargo: newState.cargo,
                hull: newState.hull,
                shield: newState.shield ?? prev.shield,
                maxShield: newState.maxShield ?? prev.maxShield,
                turns: newState.turns
              }));
            }}
            galaxy={galaxy}
          />
        );
        
      case 'market':
        if (!galaxy) return null;
        return (
          <MarketScreen
            onBack={() => setAppMode('sector')}
            currentSectorId={currentSectorId}
            shipState={{
              name: shipName,
              credits: shipState.credits,
              cargo: shipState.cargo,
              maxCargo: shipState.maxCargo
            }}
            onUpdateShip={(newState) => {
              setShipState(prev => ({
                ...prev,
                credits: newState.credits,
                cargo: newState.cargo
              }));
            }}
            galaxy={galaxy}
            npcs={npcs}
            onUpdateNPCs={setNpcs}
          />
        );

      case 'stardock':
        if (!galaxy) return null;
        return (
          <StarDockScreen
            galaxy={galaxy}
            ship={{
              name: shipName,
              classId: shipClassId,
              credits: shipState.credits,
              currentSector: currentSectorId,
              cargo: shipState.cargo,
              hull: shipState.hull,
              shield: shipState.shield,
              turns: shipState.turns,
              maxTurns: shipState.maxTurns,
              upgrades,
            }}
            onUpdateShip={(newShip) => {
              setShipClassId(newShip.classId);
              setUpgrades(newShip.upgrades);
              const newStats = computeEffectiveStats(newShip.classId, newShip.upgrades);
              const cargoTotal = newShip.cargo.ore + newShip.cargo.organics + newShip.cargo.equipment;
              const clampedCargo = cargoTotal > newStats.maxCargo
                ? { ...newShip.cargo, ore: Math.min(newShip.cargo.ore, newStats.maxCargo) }
                : newShip.cargo;
              setShipState(prev => ({
                ...prev,
                credits: newShip.credits,
                cargo: clampedCargo,
                maxCargo: newStats.maxCargo,
                maxShield: newStats.shieldPoints,
                hull: newStats.maxHull, // repair hull at StarDock
                shield: newStats.shieldPoints, // recharge shield at StarDock
              }));
            }}
            onBack={() => setAppMode('sector')}
          />
        );

      case 'combat':
        if (!combatEnemy) return null;
        return (
          <CombatScreen
            player={{
              name: shipName || 'Your Ship',
              hull: shipState.hull,
              maxHull: effectiveStats.maxHull,
              shield: shipState.shield,
              maxShield: shipState.maxShield,
              weaponDamage: 5 + effectiveStats.combatBonus,
              dodgeChance: effectiveStats.dodgeChance,
              credits: shipState.credits,
            }}
            enemy={combatEnemy}
            onCombatEnd={handleCombatEnd}
            onQuit={handleQuit}
          />
        );
        
      default:
        return null;
    }
  };

  // Status bar items based on mode
  const getStatusItems = () => {
    switch (appMode) {
      case 'welcome':
        return [
          { key: '↑↓', action: 'Navigate' },
          { key: 'Enter', action: 'Select' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'slotSelect':
      case 'galaxySize':
      case 'shipClass':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'Enter', action: 'Choose' },
          { key: 'Esc', action: 'Back' }
        ];
      case 'shipName':
        return [
          { key: 'Type', action: 'Name' },
          { key: 'Enter', action: 'Confirm' },
          { key: 'Esc', action: 'Cancel' }
        ];
      case 'sector':
        return [
          { key: '↑↓←→', action: 'Move' },
          { key: 'M', action: 'Market' },
          ...(galaxy?.stardocks.includes(currentSectorId) ? [{ key: 'D', action: 'StarDock' }] : []),
          { key: 'Esc', action: 'Menu' },
          { key: 'Q', action: 'Quit' }
        ];
      case 'market':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'B', action: 'Buy' },
          { key: 'S', action: 'Sell' },
          { key: 'Esc', action: 'Back' }
        ];
      case 'stardock':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'Enter', action: 'Buy' },
          { key: 'Esc', action: 'Leave' }
        ];
      case 'combat':
        return [
          { key: '↑↓', action: 'Select' },
          { key: 'Enter', action: 'Confirm' },
          { key: 'Q', action: 'Quit' }
        ];
      default:
        return [{ key: 'Q', action: 'Quit' }];
    }
  };

  // Show overwrite confirmation
  if (showNewGameConfirm) {
    return (
      <ConfirmDialog
        message={`Galaxy ${pendingSlot === 1 ? 'A' : pendingSlot === 2 ? 'B' : 'C'} already has a save. Overwrite?`}
        onConfirm={confirmOverwrite}
        onCancel={() => {
          setShowNewGameConfirm(false);
          setPendingSlot(null);
        }}
        defaultToConfirm={false}
      />
    );
  }

  return (
    <AppLayout statusItems={getStatusItems()}>
      {renderContent()}
    </AppLayout>
  );
};

render(<App />);
