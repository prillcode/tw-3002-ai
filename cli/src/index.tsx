import React, { useState, useEffect, useMemo } from 'react';
import { render } from 'ink';
import { useScreen } from './hooks';
import { AppLayout, ConfirmDialog } from './components';
import { WelcomeScreen, SectorScreen, MarketScreen, SlotSelectScreen, GalaxySizeScreen, StarDockScreen, ShipClassSelectScreen } from './screens';
import { initDatabase, saveGame, loadGame, hasSave, clearSave, type GameState, type Database } from './db';
import { createGalaxy, getShipClass, computeEffectiveStats, type Galaxy } from '@tw3002/engine';

type AppMode = 'welcome' | 'slotSelect' | 'galaxySize' | 'shipName' | 'shipClass' | 'sector' | 'market' | 'stardock';
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
    turns: 80,
    maxTurns: 80
  });
  
  // Confirmation dialogs
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);

  // Compute effective stats from class + upgrades
  const effectiveStats = useMemo(
    () => computeEffectiveStats(shipClassId, upgrades),
    [shipClassId, upgrades]
  );

  // Auto-save whenever state changes
  useEffect(() => {
    if (shipName && selectedSlot && galaxy) {
      const gameState: GameState = {
        shipName,
        credits: shipState.credits,
        currentSector: currentSectorId,
        cargo: shipState.cargo,
        hull: shipState.hull,
        turns: shipState.turns,
        maxTurns: shipState.maxTurns,
        shipClassId,
        upgradesJson: JSON.stringify(upgrades),
        galaxyJson: galaxyToJson(galaxy),
      };
      saveGame(db, selectedSlot, gameState);
    }
  }, [shipName, currentSectorId, shipState, selectedSlot, galaxy, db, shipClassId, upgrades]);

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
  const handleSelectSlot = (slotId: number, isEmpty: boolean) => {
    setSelectedSlot(slotId);
    
    if (selectMode === 'new') {
      if (isEmpty) {
        setAppMode('galaxySize');
      } else {
        setPendingSlot(slotId);
        setShowNewGameConfirm(true);
      }
    } else if (selectMode === 'continue') {
      loadExistingGame(slotId);
    }
  };
  
  // Start fresh game — generate galaxy, then pick ship class
  const startNewGame = (slotId: number, sectorCount: number = 100) => {
    clearSave(db, slotId);
    const newGalaxy = createGalaxy({ seed: Date.now(), sectorCount });
    setGalaxy(newGalaxy);
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
  const handleClassSelect = (classId: string) => {
    const shipClass = getShipClass(classId);
    const stats = shipClass?.baseStats ?? getShipClass('merchant')!.baseStats;
    setShipClassId(classId);
    setShipState({
      credits: 5000,
      cargo: { ore: 0, organics: 0, equipment: 0 },
      maxCargo: stats.maxCargo,
      hull: stats.maxHull,
      turns: stats.maxTurns,
      maxTurns: stats.maxTurns,
    });
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
  const loadExistingGame = (slotId: number) => {
    const save = loadGame(db, slotId);
    if (save) {
      setShipName(save.shipName);
      setCurrentSectorId(save.currentSector);
      setShipClassId(save.shipClassId ?? 'merchant');
      setUpgrades(save.upgradesJson ? JSON.parse(save.upgradesJson) : {});
      
      // Compute effective stats for maxCargo
      const stats = computeEffectiveStats(
        save.shipClassId ?? 'merchant',
        save.upgradesJson ? JSON.parse(save.upgradesJson) : {}
      );
      
      setShipState({
        credits: save.credits,
        cargo: save.cargo,
        maxCargo: stats.maxCargo,
        hull: save.hull,
        turns: save.turns,
        maxTurns: save.maxTurns,
      });
      setSelectedSlot(slotId);
      
      if (save.galaxyJson) {
        setGalaxy(galaxyFromJson(save.galaxyJson));
      } else {
        setGalaxy(createGalaxy({ seed: 42 }));
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
        turns: shipState.turns,
        maxTurns: shipState.maxTurns,
        shipClassId,
        upgradesJson: JSON.stringify(upgrades),
        galaxyJson: galaxyToJson(galaxy),
      });
    }
    process.exit(0);
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
            onBack={handleBack}
            shipName={shipName || 'Unnamed Vessel'}
            currentSectorId={currentSectorId}
            onUpdateSector={setCurrentSectorId}
            shipState={{ ...shipState, name: shipName }}
            onUpdateShip={(newState) => {
              setShipState(prev => ({
                ...prev,
                credits: newState.credits,
                cargo: newState.cargo,
                hull: newState.hull,
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
              turns: shipState.turns,
              maxTurns: shipState.maxTurns,
              upgrades,
            }}
            onUpdateShip={(newShip) => {
              setShipClassId(newShip.classId);
              setUpgrades(newShip.upgrades);
              setShipState(prev => ({
                ...prev,
                credits: newShip.credits,
              }));
              // Recompute maxCargo from new upgrades
              const newStats = computeEffectiveStats(newShip.classId, newShip.upgrades);
              setShipState(prev => ({
                ...prev,
                credits: newShip.credits,
                maxCargo: newStats.maxCargo,
              }));
            }}
            onBack={() => setAppMode('sector')}
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
