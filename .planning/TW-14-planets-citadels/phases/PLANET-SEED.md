# Planet Seed Log

**Date:** 2026-05-03  
**Work Item:** TW-13 / TW-14 — Planets & Citadels  
**Galaxy:** The Void — Shared Galaxy (ID: 1, 1000 sectors)  
**Action:** Seeded 10 unclaimed starter planets into dangerous sectors

---

## Why

Planets were never auto-generated during galaxy creation. Until seeded, the following features were effectively dead:
- "Colonize Planets" daily mission (impossible with no planets)
- "Planets Held" leaderboard tab (empty)
- Genesis Torpedo mechanic (invisible until a player randomly tries it)

10 planets = 1% of sectors. Enough to be discoverable, not so many that player-created planets lose value.

---

## Seed Method

Direct SQL insert into production D1 (`tw3002-galaxy`). Planets are:
- **Unclaimed** (`owner_id = 0`)
- **In dangerous sectors** (away from FedSpace/StarDocks)
- **Zero colonists/resources** (fresh starts for whoever colonizes)
- **Citadel level 0**

Sector `planet_count` incremented to maintain consistency with `handleCreatePlanet` logic.

---

## Planet List

| ID | Sector | Sector Name | Planet Name | Class | Type |
|---|---|---|---|---|---|
| 1 | 152 | Merak Depot | Merak Colony | M | Earth Type |
| 2 | 165 | Altair Hub | Altair Wastes | K | Desert |
| 3 | 233 | Mira Crossroads | Mira Deep | O | Oceanic |
| 4 | 240 | Lyra Depot | Lyra Spire | L | Mountainous |
| 5 | 283 | Castor Drift | Castor Frost | C | Glacial |
| 6 | 319 | Sirius Junction | Sirius Caldera | H | Volcanic |
| 7 | 396 | Mira Nexus | Mira Garden | M | Earth Type |
| 8 | 451 | Polaris Gate | Polaris Dunes | K | Desert |
| 9 | 545 | Castor Reach | Castor Abyss | O | Oceanic |
| 10 | 767 | Antares Station | Antares Crag | L | Mountainous |

### Class Distribution

| Class | Count | Description |
|---|---|---|
| M — Earth Type | 2 | Balanced production |
| K — Desert | 2 | Excellent fuel ore |
| O — Oceanic | 2 | Massive organics |
| L — Mountainous | 2 | Best fighter production |
| C — Glacial | 1 | Low production, penal colony |
| H — Volcanic | 1 | Massive fuel reserves |

---

## SQL Executed

```sql
INSERT INTO planets (galaxy_id, sector_index, owner_id, name, class, colonists, fuel, organics, equipment, fighters, citadel_level) VALUES
(1, 152, 0, 'Merak Colony', 'M', 0, 0, 0, 0, 0, 0),
(1, 165, 0, 'Altair Wastes', 'K', 0, 0, 0, 0, 0, 0),
(1, 233, 0, 'Mira Deep', 'O', 0, 0, 0, 0, 0, 0),
(1, 240, 0, 'Lyra Spire', 'L', 0, 0, 0, 0, 0, 0),
(1, 283, 0, 'Castor Frost', 'C', 0, 0, 0, 0, 0, 0),
(1, 319, 0, 'Sirius Caldera', 'H', 0, 0, 0, 0, 0, 0),
(1, 396, 0, 'Mira Garden', 'M', 0, 0, 0, 0, 0, 0),
(1, 451, 0, 'Polaris Dunes', 'K', 0, 0, 0, 0, 0, 0),
(1, 545, 0, 'Castor Abyss', 'O', 0, 0, 0, 0, 0, 0),
(1, 767, 0, 'Antares Crag', 'L', 0, 0, 0, 0, 0, 0);

UPDATE sectors SET planet_count = planet_count + 1
WHERE galaxy_id = 1 AND sector_index IN (152, 165, 233, 240, 283, 319, 396, 451, 545, 767);
```

---

## Future Considerations

- If player count grows significantly (>50 active), consider seeding another 10–20 planets
- Planet locations are discoverable through exploration (no public list in-game)
- First player to reach and colonize each planet gets "First Colonist" bragging rights
