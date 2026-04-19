// Database exports
export { initDatabase, type Database } from './database';
export {
  saveGame,
  loadGame,
  hasSave,
  hasAnySave,
  getSlotInfo,
  getAllSlotInfo,
  clearSave,
  clearAllSaves,
  safeLoadGame,
  SLOT_NAMES,
  type GameState,
  type SlotInfo
} from './saveLoad';
