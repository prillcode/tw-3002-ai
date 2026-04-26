# TW 3002 AI — Universe Bible

> The creative identity of our game. Every planning doc, every NPC name, every piece of flavor text should reference this document to maintain a consistent universe.

---

## Core Identity

**TradeWars 3002 AI** is a space trading and territory control game rooted in the mechanical tradition of TradeWars 2002, with a thematic identity inspired by Frank Herbert's *Dune*.

We are not retelling Dune's story. We are building our own universe that shares Dune's obsessions: a precious resource that makes civilization possible, feudal power structures in space, mystical traditions that blur the line between religion and technology, and the eternal tension between individual freedom and systemic control.

---

## The Resource: Melange

Melange (commonly called "the spice") is the rarest and most valuable substance in the known universe. It is found naturally in only a handful of sectors — deep-space anomalies where the conditions for its formation exist.

### Properties
- Extends lifespan and enhances consciousness
- **Enables TransWarp navigation** — without melange, a Navigator cannot fold space. Ships carrying melange can jump directly to any sector they've visited, bypassing warp lanes entirely
- Addictive with regular use; withdrawal is fatal
- Cannot be synthesized — only harvested from natural deposits

### Mechanical Role
- **4th trade commodity** alongside ore, organics, and equipment
- **Extremely high value** — a single hold of melange is worth 10–50x a hold of ore
- **Extremely rare supply** — only appears at ports in specific sectors (analogous to Dune's desert)
- **Required for TransWarp** — consuming 1 unit of melange per TransWarp jump (mechanic for future ship classes)
- **Planets can produce melange** — only certain planet classes (M, H) in specific conditions
- **CHOAM controls the supply** — the trade cartel sets prices and restricts flow

### Economic Impact
- Melange transforms the economy from "trade ore between ports" to "who controls the spice controls the galaxy"
- It creates natural conflict: rare sectors with melange deposits become strategic flashpoints
- It gives planets real strategic value beyond fighter production
- It provides the endgame economic engine: melange farming on H-class volcanic planets

---

## Factions

### The CHOAM Cartel
*The invisible hand that moves the stars.*

CHOAM (Combine Honnete Ober Advancer Mercantiles) is the interstellar trade cartel that controls commerce, operates StarDocks, and maintains the space lanes. They are not a government — they are something more powerful: the organization that makes civilization possible.

**In-game role:**
- Operates all StarDocks (the safe harbors where players buy upgrades, insurance, ships)
- Controls CHOAM Protected Space (the equivalent of FedSpace — safe sectors where violence is prohibited)
- Issues **Guild Commissions** to good-aligned players at +1,000 alignment
- Posts bounties on smugglers and thieves
- Generates the news broadcasts (CHOAM Broadband)
- The "neutral authority" — they don't pick sides, they enforce order

**NPC representation:** Guild Sentinels patrol CHOAM Protected Space. CHOAM Merchants move between ports.

### The Fremen
*The desert people. The hidden ones.*

Fremen are independent warriors who live beyond CHOAM's reach, in the deep sectors where the spice flows. They are not evil — they are fiercely territorial. They deploy fighters to protect their sectors, toll travelers, and attack those who disrespect their sovereignty. Their combat skills are legendary.

**In-game role:**
- **Replaces generic "raider" NPCs** — Fremen warriors patrol dangerous sectors
- Deploy fighters aggressively (Defensive and Offensive modes)
- Will toll travelers through their territory (5 cr/fighter or fight)
- Attack Sardaukar on sight (faction hostility)
- Neutral to CHOAM — they don't attack Guild assets
- Killing Fremen gives negative alignment (they're not evil, just dangerous)
- Fremen-controlled sectors are identifiable by fighter density

**NPC behavior:** High aggression, high caution, low greed. They fight to defend, not to rob.

### The Sardaukar
*The Emperor's fists. Born in hell, forged in fire.*

Sardaukar are elite military enforcers — the most feared warriors in the known universe. They answer to no law but their own. In the void between sectors, Sardaukar raiders prey on traders, extort tolls, and destroy those too weak to resist. They are brutal, organized, and relentless.

**In-game role:**
- **The "evil" raider faction** — Sardaukar attack everyone, including other NPCs
- Grow stronger over time (accumulate fighters and credits)
- Hold territory aggressively — Sardaukar-controlled sectors are death traps
- Killing Sardaukar gives positive alignment (they're the enemy of civilization)
- Sardaukar do not enter CHOAM Protected Space
- They are the primary threat that makes deep space dangerous

**NPC behavior:** Maximum aggression, low caution, moderate greed. They attack first and never flee.

### Guild Navigators
*The ones who fold space. The ones who see.*

Navigators are the pilots of the Spacing Guild — mutated by melange exposure into beings with limited prescience. They are rare, powerful, and mysterious. A Navigator appears only in special encounters.

**In-game role:**
- **Rare NPC encounter** — a Navigator may appear at StarDock or in deep space
- Offers cryptic information: "The currents speak of danger in Sector 42" (hints at Sardaukar activity or valuable melange deposits)
- Future: could offer quests, intel, or TransWarp coordinates
- Purely atmospheric for now — no mechanical impact until we build the quest system

**NPC behavior:** Non-combat. Appears, speaks, departs.

### Free Traders
*Just trying to make a living out here.*

Independent merchants who move between ports buying and selling goods. They avoid conflict, follow the trade lanes, and keep their heads down. The backbone of the economy.

**In-game role:**
- **Standard trader NPCs** — move between ports, buy low, sell high
- No faction allegiance — they're independents
- Provide liquidity in the economy (they trade, ports don't run dry)
- Easy targets for evil players (killing them gives negative alignment)

**NPC behavior:** Low aggression, high caution, moderate greed. They flee from combat.

---

## Faction Relationships

```
                    CHOAM Cartel
                   (trade authority)
                   /            \
              protects          opposes
                /                  \
    Guild Sentinels          Sardaukar Raiders
         |                        |
     tolerates                attacks
         |                        |
      Fremen Warriors  ←——→  Free Traders
     (territorial)         (neutral)
```

- **CHOAM vs Sardaukar:** CHOAM protects civilized space; Sardaukar prey on it. Guild Sentinels attack Sardaukar on sight.
- **CHOAM vs Fremen:** Uneasy tolerance. CHOAM doesn't control Fremen territory. Fremen don't attack CHOAM assets.
- **Fremen vs Sardaukar:** Mutual hostility. They fight over deep-space territory.
- **Free Traders:** Neutral to all. Everyone's customer, everyone's target.
- **Players:** Choose their own alignment. Good = CHOAM ally. Evil = smuggler/thief. The Fremen and Sardaukar react to player alignment.

---

## Player Alignment (TW-15 Integration)

| Alignment | Faction Standing | Perks | Consequences |
|-----------|-----------------|-------|-------------|
| **+1000 (Commissioned)** | CHOAM Ally | Guild Commission, access to ISS-equivalent ship ("Guild Navigator"), TransWarp, safe harbor everywhere | Sardaukar target you specifically |
| **+1 to +999 (Good)** | CHOAM Friendly | CHOAM Protected Space, insurance, StarDock access | Standard gameplay |
| **0 (Neutral)** | Independent | No perks, no penalties | On your own |
| **-1 to -99 (Evil)** | Smuggler | Rob/steal at ports, black market ships, Fremen tolerate you | No CHOAM protection, Guild Sentinels may attack, bounties on your head |
| **-100 or lower** | Outlaw | Full evil path access (SSM, SST, mega-rob) | Actively hunted by Guild Sentinels |

### Alignment-Gated Content
- **TransWarp** requires melange + a ship with a TransWarp drive (ISS-equivalent or late-game ship)
- **Rob/Steal** requires evil alignment (-100 or lower)
- **Guild Commission** requires +1,000 alignment
- **Fremen neutrality** — evil players don't get tolled by Fremen fighters (they're "friends of the desert")
- **Sardaukar aggression** — good-aligned players are priority targets for Sardaukar

---

## Ship Classes (Dune-Inspired)

| Current Name | New Name | Dune Feel | Notes |
|---|---|---|---|
| Merchant Cruiser | **Spice Runner** | Small cargo hauler threading the trade lanes | Starting ship. Balanced. |
| Scout Marauder | **Dune Skiff** | Fast, light, exploring the deep sectors | Recon ship. 2 turns/warp. |
| Interceptor | **Sardaukar Blade** | Military-grade interceptor | Aggressive ship. High hull. |
| *Future: Missile Frigate* | **Laser Frigate** | Mid-combat ship with lasgun banks | 5k fighters, 1.3:1 odds |
| *Future: Havoc GunStar* | **Siege Breaker** | Heavy assault platform | Tank. 10k fighters. |
| *Future: ISS* | **Guild Navigator** | The ultimate ship. Commissioned only. | TransWarp, 50k fighters, requires melange |
| *Future: Interdictor Cruiser* | **Blockade Monitor** | Sector denial specialist | 100k fighters. The endgame ship. |

---

## Terminology Guide

When writing flavor text, UI copy, or planning docs, use these terms:

| TW2002 Term | Our Term | Context |
|---|---|---|
| FedSpace | **CHOAM Protected Space** | Safe sectors enforced by the Guild |
| StarDock | **StarDock** (keep it) | A CHOAM station — the safe harbor |
| Federation | **CHOAM / The Guild** | The trade authority |
| Ferrengi | **Sardaukar** (evil) / **Fremen** (territorial) | Split into two factions |
| ISS | **Guild Navigator** | The commissioned endgame ship |
| Commission | **Guild Commission** | CHOAM commissions good-aligned captains |
| Insurance | **Guild Protection Contract** | CHOAM insures your ship |
| Wanted / Bounty | **CHOAM Bounty** | Posted by the Guild on smugglers |
| News | **CHOAM Broadband** | Guild-controlled information network |
| Ore / Organics / Equipment | Keep as-is | Standard commodities |
| Melange / Spice | **Melange** (formal) / **Spice** (colloquial) | 4th commodity, enables TransWarp |
| Fighters | **Fighters** (keep it) | Deployed combat drones |
| Warp / TransWarp | **Warp** / **TransWarp** | Standard warp = lane travel. TransWarp = direct jump consuming melange |
| Alignment | **Alignment** (keep it) | Good = CHOAM standing. Evil = outlaw. |
| Rob / Steal | Keep as-is | Evil-path port interactions |

---

## Tone and Voice

Our universe should feel like:

- **Ancient and vast** — not shiny sci-fi, but weathered and deep. Bronze and shadow.
- **Political and economic** — power is about trade routes and resource control, not laser battles
- **Mystical undertones** — the Ashlan Order, prescience, the spiritual weight of spice
- **Morally gray** — CHOAM isn't "good" (they're a monopoly). Fremen aren't "evil" (they're defending their home). Sardaukar aren't "misunderstood" (they're brutal). Player choices have consequences.
- **Quietly epic** — news broadcasts, Navigator prophecies, sector descriptions should feel like you're hearing fragments of a much larger story

---

## What We Don't Use

To respect the original work:

- **No family names:** Atreides, Harkonnen, Corrino, Vernius, Richese
- **No character names:** Paul, Jessica, Leto, Duncan, Baron Vladimir, Stilgar, Chani, Gurney
- **No direct plot points** from the novels
- **"Dune" is not used** as a proper noun in our game (lowercase "dune" in compound words like "dune skiff" is fine)
- **Our story is our own** — we share the worldbuilding vocabulary, not the narrative

---

## Implementation Priority

This is a **content and naming layer**, not a mechanical overhaul. Implementation order:

1. **Rename NPC factions** — Add `faction` to persona, update generator with faction-specific name pools (low effort, high impact)
2. **Add melange as 4th commodity** — Schema, API, UI (medium effort — this is the only mechanical change)
3. **Update flavor text** — StarDock descriptions, combat narratives, news templates, sector descriptions (ongoing)
4. **Rename ship classes** — Update `ships.ts` and seed data (low effort)
5. **TW-15 alignment integration** — Faction-based alignment consequences (planned)
6. **TransWarp + melange fuel** — Post-TW-15, when advanced ships are introduced

---

*"The spice must flow."*
