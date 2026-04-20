# PLAN: TW-01 Phase 6b — Multi-Slot Galaxy System

**Work Item:** TW-01-cli-client  
**Phase:** 6b (Extension of Phase 6)  
**Estimated Duration:** 30-45 minutes  
**Goal:** Support 3 separate galaxy slots per player (local), foundation for multi-galaxy cloud play

---

## Objective

Extend the SQLite persistence from single-save to 3-slot system. Each slot represents a separate galaxy instance with independent:
- Ship name and character
- Credits and cargo
- Current sector location
- Game progress

This enables players to experiment with different strategies (trader vs pirate vs explorer) without losing their main game, and provides the foundation for the "one character per galaxy" multiplayer model.

---

## Context

### What We Have (Phase 6)
- Single save slot (hardcoded `id = 1`)
- Auto-save on state changes
- Continue option in main menu
- New Game warns before overwriting

### What We're Building (Phase 6b)
- 3 distinct save slots
- "Select Galaxy" screen before play
- Each slot = isolated game instance
- Visual summary of each slot (ship name, credits, last played)

### Future-Proofing
- Local `slot_id` (1, 2, 3) becomes cloud `galaxy_id`
- Same schema works for both local and shared galaxies
- "Email + Galaxy ID" for cloud maps to "Slot" for local

---

## Tasks

### Task 1: Update Database Schema (10 min)
**Modify `src/db/database.ts` and `src/db/saveLoad.ts`**

**Schema Change:**
```sql
-- Remove CHECK (id = 1) constraint
-- Add slot_id column
CREATE TABLE saves (
  slot_id INTEGER PRIMARY KEY CHECK (slot_id BETWEEN 1 AND 3),
  ship_name TEXT,
  credits INTEGER DEFAULT 5000,
  current_sector INTEGER DEFAULT 42,
  cargo_ore INTEGER DEFAULT 0,
  cargo_organics INTEGER DEFAULT 0,
  cargo_equipment INTEGER DEFAULT 0,
  hull INTEGER DEFAULT 100,
  turns INTEGER DEFAULT 100,
  max_turns INTEGER DEFAULT 100,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Migration:**
- If existing save with `id = 1`, migrate to `slot_id = 1`
- Drop old table, create new schema

**Verification:**
- [ ] Schema supports slots 1, 2, 3
- [ ] Existing save migrated to slot 1
- [ ] Can query by slot_id

---

### Task 2: Update Save/Load Functions (10 min)
**Modify `src/db/saveLoad.ts`**

**Changes:**
- `saveGame(slotId, state)` - takes slot parameter
- `loadGame(slotId)` - loads specific slot
- `hasSave(slotId)` - checks specific slot
- `getSaveInfo(slotId)` - gets metadata for slot
- `clearSave(slotId)` - clears specific slot
- `listAllSaves()` - returns info for all 3 slots

**API:**
```typescript
export const saveGame = (db: Database, slotId: number, state: GameState): void
export const loadGame = (db: Database, slotId: number): GameState | null
export const hasSave = (db: Database, slotId: number): boolean
export const listAllSaves = (db: Database): SaveInfo[] // Returns array of 3
```

**Verification:**
- [ ] Can save to slot 1, 2, 3 independently
- [ ] Loading slot 2 doesn't affect slot 1
- [ ] Each slot has separate state

---

### Task 3: Create Slot Selection Screen (15 min)
**Create `src/screens/SlotSelectScreen.tsx`**

**Requirements:**
- Shows 3 slots as selectable options
- Each slot displays:
  - Galaxy name ("Galaxy A", "Galaxy B", "Galaxy C")
  - Ship name (if saved)
  - Credits (if saved)
  - "[Empty]" or "[New Game]" if no save
  - Last played timestamp (if saved)
- Keyboard: ↑↓ to select, Enter to choose, Esc to back

**Visual:**
```
╔══════════════════════════════════════════════╗
║         SELECT GALAXY TO PLAY                ║
╠══════════════════════════════════════════════╣
║                                              ║
║ → Galaxy A                                   ║
║   Star Runner - 15,000 cr                   ║
║   Last played: 2 hours ago                   ║
║                                              ║
║   Galaxy B                                   ║
║   [New Game]                                 ║
║                                              ║
║   Galaxy C                                   ║
║   [New Game]                                 ║
║                                              ║
╠══════════════════════════════════════════════╣
║  [↑↓] Select  [Enter] Play  [Esc] Back       ║
╚══════════════════════════════════════════════╝
```

**Props:**
```typescript
interface SlotSelectScreenProps {
  db: Database;
  onSelectSlot: (slotId: number) => void;
  onBack: () => void;
}
```

**Verification:**
- [ ] Renders 3 slots
- [ ] Shows correct info for each slot
- [ ] Empty slots show "[New Game]"
- [ ] Navigation works (↑↓, Enter, Esc)

---

### Task 4: Update WelcomeScreen Flow (10 min)
**Modify `src/screens/WelcomeScreen.tsx` and `src/index.tsx`**

**New Flow:**
```
Title Screen
  ↓ (Press any key)
Main Menu
  → New Game → Slot Select → Ship Name Input → Game
  → Continue → Slot Select (saved only) → Game
  → Quit
```

**Changes:**
- "New Game" goes to Slot Select (can choose any of 3)
- "Continue" goes to Slot Select (shows only saved slots)
- Slot selection triggers either:
  - New game flow (if slot empty)
  - Load game (if slot has save)

**App.tsx Updates:**
- Track `selectedSlot` in state
- Pass slot ID to save/load functions
- Save to specific slot, load from specific slot

**Verification:**
- [ ] New Game → Slot Select → Can choose empty slot
- [ ] Continue → Slot Select → Shows saved slots
- [ ] Selecting slot with save loads correctly
- [ ] Selecting empty slot starts new game flow

---

### Task 5: Handle Overwrite Confirmation (5 min)
**Reuse existing ConfirmDialog**

**Behavior:**
- If selecting slot with existing save for "New Game"
- Show: "Galaxy A already has a save. Overwrite?"
- Yes: Clear slot, start new game
- No: Return to slot selection

**Implementation:**
- Check `hasSave(slotId)` when slot selected
- If has save and mode is "new", show confirmation
- If has save and mode is "continue", load directly

**Verification:**
- [ ] Warning shows when overwriting
- [ ] Cancelling preserves existing save
- [ ] Confirming clears and starts fresh

---

## Verification Checklist

Before marking done:

- [ ] 3 slots visible in selection screen
- [ ] Each slot saves/loads independently
- [ ] Slot A progress doesn't affect Slot B
- [ ] Empty slots show "[New Game]"
- [ ] Saved slots show ship name and credits
- [ ] Overwrite confirmation works
- [ ] Can play 3 completely different games
- [ ] TypeScript passes
- [ ] `bun run dev` shows working slot system

---

## Done Conditions

This phase is **DONE** when:

1. Player can select from 3 galaxy slots on startup
2. Each slot is an isolated game instance
3. Player can have trader in slot 1, pirate in slot 2, explorer in slot 3
4. Overwrite protection prevents accidental loss
5. Schema supports future cloud migration (slot_id → galaxy_id)
6. Ready for Phase 7 (packaging) or TW-02 (game engine)

---

## Future-Proofing Notes

**Local to Cloud Migration:**
```typescript
// Local now:
slot_id: 1 | 2 | 3

// Cloud later:
player_email: 'user@example.com'
galaxy_id: 'galaxy-42' | 'prill-private-1'

// Same query pattern:
SELECT * FROM saves WHERE player_email = ? AND galaxy_id = ?
// vs
SELECT * FROM saves WHERE slot_id = ?
```

**Character Play Styles:**
- Could add `play_style` column later ('trader', 'pirate', 'explorer')
- Affects starting ship, initial credits, sector placement
- Not implemented now, schema ready for it

---

## Next Step

After this plan is complete:
- Phase 6 + 6b = Complete persistence system
- Ready for Phase 7 (packaging and polish)
- OR pivot to TW-02 (game engine enhancements)
