# TW-01 Roadmap: CLI Client

**Estimated Total:** 25-34 hours (3-4 focused sessions)

## Phase 1: Project Scaffold (2-3 hours)
**Goal:** Bun + Ink project running with hello-world TUI

**Deliverables:**
- [ ] `cli/` directory with `package.json` (Bun runtime, Ink, React types)
- [ ] TypeScript config (`tsconfig.json`)
- [ ] Entry point: `src/index.tsx` with basic Ink app
- [ ] Dev script: `bun run dev` launches TUI
- [ ] Build script: `bun run build` compiles to binary
- [ ] README with setup instructions

**Success:** `bun run dev` shows "Hello TW 3002" in terminal.

---

## Phase 2: Core TUI Components (4-6 hours)
**Goal:** Reusable component library for game screens

**Deliverables:**
- [ ] `src/components/Box.tsx` — styled container with borders
- [ ] `src/components/Text.tsx` — colored text (green=ok, red=danger, yellow=warning)
- [ ] `src/components/Menu.tsx` — keyboard-navigable menu list
- [ ] `src/components/StatusBar.tsx` — persistent bottom bar with keys/help
- [ ] `src/hooks/useKeyHandler.ts` — centralized keyboard input
- [ ] `src/hooks/useScreen.ts` — screen router (welcome/sector/market/combat)

**Success:** Can navigate between 3 blank screens via arrow keys.

---

## Phase 3: Welcome Screen (3-4 hours)
**Goal:** Authentic BBS-era landing experience

**Deliverables:**
- [ ] ANSI art title "TW 3002 AI" (ASCII or via `figlet`)
- [ ] Subtitle: "A Trade Wars 2002 Revival"
- [ ] Menu: [New Game] [Continue] [Settings] [Quit]
- [ ] New Game → ship name prompt
- [ ] Continue → list local save files
- [ ] Settings → placeholder for future options

**Success:** Screen looks like a BBS door game from 1994.

---

## Phase 4: Sector View (6-8 hours)
**Goal:** Main game screen showing galactic position

**Deliverables:**
- [ ] `src/screens/SectorScreen.tsx`
- [ ] Three-panel layout: [Nav] [Center] [Info]
- [ ] Left: Neighboring sectors list (selectable)
- [ ] Center: ASCII sector map (current + neighbors)
- [ ] Right: Current sector info (port type, danger level)
- [ ] Bottom: Ship status bar (credits, cargo, fuel, turns)
- [ ] Movement: arrow keys to select, Enter to jump

**Success:** Can view a 3-sector radius and move between sectors.

---

## Phase 5: Market Interface (4-5 hours)
**Goal:** Trading screen for port interactions

**Deliverables:**
- [ ] `src/screens/MarketScreen.tsx`
- [ ] Triggered when entering sector with port
- [ ] Display: Commodity prices (ore, organics, equipment)
- [ ] Player cargo hold display
- [ ] Buy/Sell interface with quantity input
- [ ] Transaction confirmation
- [ ] Return to Sector screen

**Success:** Can buy/sell commodities at ports (UI only, no game logic).

---

## Phase 6: Local Persistence (3-4 hours)
**Goal:** SQLite integration for save/continue

**Deliverables:**
- [ ] `src/db/` with `bun:sqlite` client
- [ ] Schema: `players`, `ships`, `sectors` tables
- [ ] `db/saveGame()` — persist player state
- [ ] `db/loadGame()` — restore player state
- [ ] `db/listSaves()` — for Continue menu
- [ ] Auto-save on logout

**Success:** Can create ship, quit, relaunch, and continue from same sector.

---

## Phase 7: Polish & Package Prep (3-4 hours)
**Goal:** Ready for game engine integration

**Deliverables:**
- [ ] Error handling (graceful exits)
- [ ] Loading states (async operations)
- [ ] Help screen (? key)
- [ ] Code cleanup, component documentation
- [ ] Binary compile test: `bun build` → `tw3002` executable

**Success:** CLI is stable, documented, and ready for TW-02 integration.

---

## Phase Completion Order
1 → 2 → 3 → 4 → 5 → 6 → 7

All phases are sequential (later phases depend on earlier ones).

---

## Definition of Done
- All 7 phases complete
- Player can: launch, create ship, navigate sectors, view market, save, quit, resume
- Code is typed, documented, and committed
- Ready to hand off to TW-02 for game logic integration
