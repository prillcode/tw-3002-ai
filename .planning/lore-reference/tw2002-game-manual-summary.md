# TradeWars 2002 — Complete Game Manual Summary

> Derived from the Stardock Modern Manual, compiled by the TradeWars 2002 community.
> Source: [The Stardock](https://www.thestardock.com)

---

## Core Fundamentals

**Universe Structure:** 1,000+ sectors arranged in **bubbles** (contiguous regions with limited ingress), **tunnels** (linear 2-warp chains), and **dead-ends** (no outward warps). Backdoor sectors provide one-way warps into FedSpace.

**Starting Ship:** Every player begins with **30 fighters** immediately available for defense.

**Turns & Actions:** Most actions cost turns. Some are "zero-turn" (ZTM mapping).

---

## Combat System

**Ordered Combat Sequence:**
1. Nav hazard damage
2. Limpet mine attachment (1 per entry)
3. Armid mine detonation (50% chance each)
4. **Sector Q-Cannon fire** (planetary cannons)
5. **Fighter encounter** (defensive/offensive/tolled)
6. Ship-to-ship combat (if any ships remain)

**Fighter Modes:**
- **Defensive** (1:1) — challenge: attack/retreat/surrender
- **Offensive** (1:1 but auto-attacks) — sends `1.25 × (max_shields + max_figs)`
- **Tolled** — pay 5 cr/fighter or fight at 1:1

**Q-Cannon Formulas:**
- Sector: `(TotalOre × SectPct) / 3`
- Atmospheric (MBBS): `TotalOre × AtmoPct × 2`
- Atmospheric (Classic): `TotalOre × AtmoPct × 0.5`

**Combat Odds Table:**
| Context | Odds |
|---------|------|
| Tolled/Defensive/Offensive Fig | 1:1 |
| Planet Offensive Fig | 2:1 |
| Planet Defensive Fig | 3:1 |
| Planet Shield | 20:1 |

---

## Ships & Equipment

**Ship Classes:**
| Ship | Turns/Warp | Off Odds | Max Figs | Max Shields | TransWarp? | Max Holds |
|------|-----------|----------|----------|-------------|-----------|-----------|
| Merchant Cruiser | 3 | 1.0:1 | 2,500 | 400 | No | 75 |
| Scout Marauder | 2 | 2.0:1 | 250 | 100 | No | 25 |
| Missile Frigate | 3 | 1.3:1 | 5,000 | 400 | No | 60 |
| Corporate FlagShip | 3 | 1.2:1 | 20,000 | 1,500 | **Yes** | 85 |
| Imperial StarShip | 4 | 1.5:1 | 50,000 | 2,000 | **Yes** | 150 |
| Havoc GunStar | 3 | 1.2:1 | 10,000 | 3,000 | **Yes** | 50 |
| Interdictor Cruiser | 15 | 1.2:1 | 100,000 | 4,000 | No | 40 |

**Key Mechanics:**
- **Cloaking:** Hides from scans, may fail after 24h (anomaly on density scan). Photon torpedoes force decloak.
- **TransWarp:** 3 fuel/sector. Safe only if destination has your fighters or is empty. Blind TWARP = death if limpets present.
- **Furbing:** Destroy a friendly ship loaded with holds to repair your own.
- **Genesis Torpedo:** Creates planets (purchased at most ports).

---

## Planets

**7 Planet Classes:**
| Class | Best For | Max Colonists | Fighter Production |
|-------|----------|--------------|-------------------|
| **M** (Earth) | Balanced | 30,000 | n/10 |
| **K** (Desert) | Fuel | 40,000 | n/15 |
| **O** (Oceanic) | Organics | 200,000 | n/15 |
| **L** (Mountain) | Fighters | 40,000 | n/12 |
| **C** (Glacial) | Penal colony | 100,000 | n/25 |
| **H** (Volcanic) | Fuel reserves | 100,000 | n/50 |
| **U** (Gas) | Nothing | 3,000 | 0 |

**Production Rule:** Max output at **50% of max colonists** (bell curve). Overpopulation causes die-off.

**Citadel Levels (0-6):** Each level adds defenses. Level 4+ dramatically increases daily production. Class H planets take the longest to build.

**Genesis Torpedo Probability:** Launching GTorps in a crowded sector shifts probability toward **U-class** (up to 98%). Strategy: fill sector to capacity, then destroy worst planets and re-launch.

---

## Economy & Trading

**Good Alignment — Paired-Port Trading:** Two adjacent ports exchanging opposite commodities (E↔O). Cycle until one port exhausts supply.

**Evil Alignment — Red Cashing:**
| Tactic | Profit/Turn | Alignment Shift |
|--------|-------------|----------------|
| SSM (Sell-Steal-Move) | ~14k | -15 |
| SST (Sell-Steal-Transport) | ~14k | -15 |
| SDT (Steal-Dump-Transport) | ~17k | -21 |
| Mega-Rob | ~40k | N/A |

**Rob/Steal Mechanics:**
- Rob extracts port cash (+11% over displayed amount)
- Steal extracts cargo from dock
- Bust chance: ~1 in 50
- Bust penalty: lose 10% exp, lose holds proportional to attempt

**Planet Farming:**
- **O-class Oceanic:** 50,000 organics/day at peak → ~2.5M credits/day
- **H-class Volcanic:** 50,000 fuel/day
- Port daily intake limit: 65,530 units

---

## Alignment System

**Good Path:**
- Commission at **1,000 alignment**
- ISS unlocks at **1,000 alignment**
- Alignment gain methods (credits/point):
  - Cross-pod with evil partner: cheapest
  - Post bounty on evil: 1,000 cr
  - Pay taxes: 1,500 cr
  - Build planets: 2,000 cr
  - Upgrade ports: 5,000 cr

**Evil Path:**
- Alignment range: -99 to -1
- Unlocks **Rob** and **Steal** at ports
- No FedSpace protection

**22 Ranks** from Private to Fleet Admiral, requiring exponential experience (up to 4.2M for rank 22).

---

## Corporations

**Mixed-Corp Model (Cabal Standard):**
- 3 Blue (good) + 2 Red (evil)
- Blues: map, furber, colonizer, cloak-tow
- Reds: SST/SDT/Mega-Rob income generation

**Role Splitting:**
| Blue Roles | Red Roles |
|-----------|-----------|
| Mapper/Hunter | Cash Generator |
| Furber | Stay in FedSpace |
| Colonizer | Rely on Blues |

**Daily Timeline (First Week):**
- Day 1: Map, probe dead-ends, deploy fig cloud
- Day 2: Reds at 5k exp, Blues in ISS, 85-100% map
- Day 3: Attempt Ferrengal capture
- Day 4: Destroy enemy planets before Level 2 citadels
- Day 5-7: Deploy AMTRAK, maintain 250 mines + 100% nav-hazz

---

## Blockades

**5 Blockade Types:**
| Type | Timing | Core Mechanic |
|------|--------|---------------|
| **Scout** | Early game | Scout + figs + mines, auto-pods traders |
| **Photon** | Early-mid | + photon torpedoes for turn denial |
| **Fortress** | Mid-late | Massive fig/mine concentration around SD |
| **"OMFG"** | Late | Two Interdictor Cruisers, continuous attack |
| **Terra Hazz** | No starter planets | 100% nav-hazz around Sector 1 |

**Countermeasures:**
- Wait for Extern (clears figs/mines in MSLs)
- Find backdoors (one-way warps)
- Macro-based penetration with 2k+ figs/shields
- Coordinated corp assault

---

## Navigation & Movement

**Zero-Turn Mapping (ZTM):** Lists sectors by warp connectivity without consuming turns. Used to find Stardock (6 outbound, 7+ inbound warps).

**Blind Warp:** Warp without knowing sector contents. If anything is present → **Atomic Fusion** = ship destroyed, pod in origin sector.

**Blind TWARP Procedure:**
1. Launch E-probe
2. Verify empty
3. TWARP immediately
4. Limpets are invisible to probes — risk remains

**Overnight Survival:**
- Good alignment + <1,000 exp + <99 fighters + ship limit not exceeded = safe in FedSpace
- Cloaking = alternative (but may fail after 24h)

---

## TWGS Settings

Extensive sysop configuration documented:
- Universe size, port density, warp density
- Turn limits, initial resources, corp size limits
- Combat penalty mode (MBBS vs Classic)
- Photon duration, cloaking fail rate, nav-hazz dispersion
- Item costs (Genesis torpedo: 80k, Photon missile: 160k, Cloak: 6,250)
