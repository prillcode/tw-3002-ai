# Pod Mechanics

## Overview
When a ship is destroyed, the game places the pilot’s escape pod in a sector determined by two distinct rules:

1. **Self‑destruction** – the pod is sent to the ship’s **previous sector**.  
2. **Killed by another player** – the pod follows the **safe‑path algorithm**.

Understanding both mechanisms enables precise control of pod placement during invasions, retreats, and other risky maneuvers.

---

## Previous Sector

The game tracks a *previous‑sector* field that is updated whenever the ship changes location. The value stored is used as the pod destination if the pilot kills himself (e.g., by blowing up on a quasar, hitting a naval hazard, or any other self‑inflicted fatal event).

| Movement Type | Effect on Previous Sector |
|---------------|---------------------------|
| Manual warp or retreat (e.g., `1234 → 2345`) | Set to the sector departed from (`1234`). |
| Transport from ship A to ship B (`1234 → 2345`) | Set to the origin sector (`1234`). |
| Transport between two ships located in the same sector (`2345 → 2345`) | Set to that sector (`2345`). |
| **P‑warp** (`1234 → 2345`) | Historically set to sector 1; recent versions leave it unchanged. |
| Teammate‑p‑warp you into the same sector (`1234 → 2345`) | Updated to the destination sector (`2345`). |
| **T‑warp** (`1234 → 2345`) | Updated to the destination sector (`2345`). |
| **B‑warp** (`1234 → 2345`) | **Does not change** the previous‑sector field. |
| **B‑warp fusion** (failed b‑warp while pod is active) | Pod is placed in the sector from which the b‑warp was attempted, **ignoring** the stored previous sector. |

*Note:* The previous sector is only relevant for self‑destruction. If another player eliminates you, the safe‑path algorithm overrides this value.

---

## Safe‑Path Algorithm

When killed by another player, the pod searches for a *safe* sector to flee to. A sector qualifies as **safe** if it contains only your own fighters, belongs to your corporation, or is empty.

The algorithm proceeds as follows:

1. **Select Random Targets** – generate a set of candidate sectors 3 to 20 hops away (exact range may vary by version).  
2. **Path Planning** – compute a route from the current sector to each candidate.  
3. **Safe Advancement** – follow each route as far as possible, stopping when the next hop would enter an unsafe sector.  

The pod then materializes at the farthest reachable safe sector along the chosen route. If **all** routes encounter unsafe sectors immediately, the pod remains in the sector where it was destroyed.

### Typical Outcomes
- **At least one adjacent safe sector** – the pod will move at least one hop away, often traveling many sectors if you own multiple contiguous sectors.  
- **Surrounded by enemy fighters** – no safe adjacent sector exists; the pod stays in the death sector, making it vulnerable to immediate capture.  
- **Dead‑end or gate** – if the current sector is a dead‑end surrounded by unsafe sectors, the pod cannot escape and remains in place (example diagram below).


