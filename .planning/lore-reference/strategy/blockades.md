# Blockades Strategy Guide

## Overview
A **blockade** is a coordinated effort by one corporation to deny all other players access to a specific location, typically the **Stardock (SD)** or **Federation Space (Fed)**. Blockades are usually established early in the game to delay opponents and secure a head‑start. They rely on figs, mines, photons, or nav‑hazard (hazz) to capture, destroy, or turn‑deny incoming traders.

---

## Blockade Types

| Blockade | Typical Timing | Core Mechanics | Resource Requirements |
|----------|----------------|----------------|-----------------------|
| **Scout Blockade** | Early game | One corp member pilots a scout loaded with maximum figs (≥10), surrounded by figs, a few mines and limpets. A script monitors fig/mines triggers; when a trader trips one, the scout immediately pods the trader, tows the wreck to SD, and sells it for additional figs. | Scout ship, ~10 figs, a handful of mines/limpets; setup time < 30 seconds. |
| **Photon Blockade** | Early‑to‑mid game (photons enabled) | Similar layout to Scout Blockade, but the defending ships fire photons at any ship that trips a fig or mine, causing turn denial before podding or killing. | Same fig/mines layout plus enough photons to fire (photon missiles must be enabled in game settings). |
| **Fortress Blockade** | Mid‑to‑late game | Overwhelming concentration of figs and mines in the sectors surrounding SD. The defenders aim to out‑number any macro‑based assault, using P‑Drop or photon attacks while the attacker is still dealing with the figs. | Hundreds to thousands of figs and mines; often combined with a **Colonial Fighter Ship (CFS)** or similar high‑capacity vessel. |
| **“OMFG, they blew it up!” Blockade** | Late game (when corp has amassed massive fig stock) | Two ships in Interdictor Cruisers (IC) load the first with figs, the second with cash. The attacking ship repeatedly assaults the SD; after each attack the allied IC transfers additional figs, keeping the attack continuous until the SD is destroyed. | Hundreds of thousands of figs; two IC‑class ships; continuous Fig transfer during attack. |
| **Terra Hazz Blockade** | Games without starter planets (all players start at sector 1) | Corp creates a 100 % nav‑hazz field around sector 1, then populates adjacent Fed sectors with mines and figs. The goal is to kill ships with hazz and pod them with surrounding mines/figs. | ≈ 3–4 million credits to fund a **CFS** plus ~6 000 combined figs / shields, mines, and G‑torps; estimated total cost ≈ 1.7 million credits for the initial Fed sector setup. |

---

## Detecting a Blockade

1. **Game Age** – Check how many hours have passed since the Big Bang. Blockades become more likely after the first few hours.
2. **Game Settings** – Use `*` in the main menu to view:
   - Version (avoid outdated versions with known bugs).
   - Photon status (Photon Missile Duration ≠ 0 seconds means photons are active).
   - Initial figs/holds/credits (default 30 figs, 300 credits, 20 holds; higher values ease blockade setup).
   - New Player Planets flag (if **False**, all players start at Terra, enabling a Terra Hazz Blockade).
   - Extern timing (when external resets clear figs/mines).
   - Whether Fed‑safe players can fire photons.
3. **Log Analysis** – Identify patterns:
   - Repeated captures by a scout‑class ship → **Scout Blockade**.
   - Frequent photon fire messages from Missile Frigate or ISS‑class ships → **Photon Blockade**.
   - Large numbers of busted planets and nav‑hazz deaths, especially with no starter planets → **Terra Hazz Blockade**.
   - Massive fig deployments and continuous attacks on SD → **“OMFG” Blockade**.

---

## Circumventing Blockades

### General Principles
- **Wait Out**: If the game imposes turn limits, waiting may be the safest option, though it grants the blockading corp a head‑start.
- **Extern Timing**: Extern clears all figs and mines in Major Space Lanes (MSL). Slip through during the brief window when opponents are re‑deploying.
- **Backdoor Access**: Exploit one‑way sector connections to reach SD without passing the primary blocked route.

### Using Backdoors
1. **Void Outbound Sectors** – Void every sector that leads *out* of SD.
2. **Plot a Course to SD** – If the system returns “No route within 45 warps”, no backdoor exists.
3. **Identify Backdoor** – If a route is found, the last sector before SD is the backdoor.
4. **Confirm Additional Backdoors** – Void the identified backdoor and re‑plot; repeat to locate others.

### Macro‑Based Penetration
1. **PPT to Accumulate Cash** – Run **PPT** (Port‑to‑Port Trading) until you have enough credits for ~2 k figs or shields (whichever is cheaper).
2. **Purchase Figs/Shields** – Buy from Terra or a Class 0 port.
3. **Macro Into SD** – Use a scripted macro to move through the defended sector while answering fig/mines prompts automatically.
4. **Survive Scout Attack** – Ensure you have sufficient figs (≈ 2 k) and shields to withstand a scout’s single‑shot capture; the scout will lack enough figs to finish the kill, leaving it vulnerable to retaliation.

### Coordinated Corp Assault
- **Stage 1 – Prep**: PPT members amass ~50 k credits and ~2 k figs/shields.
- **Stage 2 – Acquire Ship**: Purchase a **Merlin (Merf)** or **Colt** equipped with a density scanner, holds, and a modest fig/shield load.
- **Stage 3 – Backdoor Entry**: One corp member uses a backdoor to SD, clears figs in the adjacent sector, and establishes a foothold.
- **Stage 4 – Fig Sweep**: A second member follows with a fig‑sweeping macro, creating a window for the first ship to escape.
- **Stage 5 – Exit**: Use the extra ship at SD to **x‑port** back into the main map, then transition to a **T‑Warp** capable vessel for unrestricted movement.

### Bypassing Photon Blockades
- Apply the same backdoor and macro tactics as for Scout Blockades.
- Expect higher resource consumption; prioritize acquiring photons if needed.
- Use retreat‑move cycles: move into the sector, retreat, wait ~1 second, then re‑enter after the photon reload delay.

### Overcoming Terra Hazz Blockades
1. **Volunteer Recon** – Plot a route past the hazz‑filled sector by voiding successive Fed sectors to locate any gaps.
2. **Fig‑Clearing Macro** – Deploy a macro that automatically kills figs and answers mine prompts while traversing.
3. **Extern Exploit** – If extern occurs before the hazz field is fully sealed, move in during the brief clearing.
4. **Corp Support** – Corps can allocate PPT‑generated cash to purchase additional figs/shields for the volunteer, increasing breakthrough odds.

> **Note:** Extern will also clear all mines and figs in the MSLs, potentially nullifying a blockade’s core defenses. Timing attacks to coincide with extern maximizes success probability.

---

## Resource Summary for Terra Hazz Blockade Setup

| Item | Approximate Quantity | Approximate Cost |
|------|----------------------|------------------|
| Cash for CFS purchase & initial ops | 3 – 4 million credits | – |
| Combined figs / shields for initial sector (≈ 6 000) | 6 000 units | Varies with market price |
| Mines, G‑torps, detectors (as many as capacity allows) | – | Included in cash estimate |
| Additional figs for later sector reinforcement | 1 – 2 million credits | – |

---

## Quick Reference Checklist

- **Before entering a game**: Check game age, photon status, initial resources, and extern schedule.
- **When encountering a blockade**:
  1. Identify the type via logs.
  2. Determine if a backdoor exists.
  3. Evaluate whether waiting for extern is feasible.
  4. If immediate access is required, prepare figs/shields via PPT and execute a macro or coordinated corp entry.
- **If blocked at Terra**: Use recon‑voiding, fig‑sweeping macros, and corps support; consider extern timing as the primary escape window.

--- 

*All values and procedures are derived from the established gameplay mechanics and veteran corp tactics.*
