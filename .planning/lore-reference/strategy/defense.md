## 1. Base Location Selection

### 1.1 Bubbles and Dead‑End Sectors
- **Bubble** – a contiguous region of at least 100 sectors with a single entrance/exit.  
- **Dead‑End Bubble** – a bubble whose interior sectors have no exits other than the entrance sector.  
- Building bases in small dead‑end bubbles limits the number of sectors an opponent can search, increasing concealment.

### 1.2 Tunnel Sectors (2‑Warp Chains)
- **Tunnel** – a linear chain of sectors (1 – 20 sectors) where each sector has exactly two warp exits; the chain is not part of a larger bubble.  
- Tunnels provide isolation from high‑traffic routes while still allowing the owner quick two‑warp ingress/egress.

### 1.3 Avoidance of High‑Traffic Areas
Do not place bases adjacent to:
| High‑Traffic Feature | Reason |
|----------------------|--------|
| Major Space Lanes (MSL) | Frequent traffic raises discovery risk |
| Stardock (Class 9 port) | Constant scanner activity |
| Class 0 ports (equipment hubs) | High‑volume trade draws attention |

### 1.4 Port‑Less Bases vs. SDT Port Integration
| Situation | Advantage | Consideration |
|----------|-----------|----------------|
| Base in a sector without a port | Maximum stealth; opponents cannot locate via blocked‑port detection | Requires independent resupply of fuel and colonists |
| Base on a sector that hosts an SDT (Sell‑Steal‑Transport) port | Red corps can steal upgrade commodities directly; beamer installation reduces relocation turns | Port becomes a focal point for opponents and may attract blockades |

---

## 2. Planet Types, Production, and Fighter Ratios

### 2.1 Production Tables

| Class | Category | Ratio | Max Colonists | Max Daily Fuel | Max Daily Org | Max Daily Equ | Max on Planet (Fuel) | Max on Planet (Org) | Max on Planet (Equ) |
|-------|----------|-------|---------------|----------------|---------------|----------------|----------------------|---------------------|----------------------|
| **M** | Fuel Ore | 3 | 30,000 | 15,000 | – | – | 100,000 | – | – |
|       | Organics | 7 | 30,000 | – | 15,000 | – | – | 100,000 | – |
|       | Equipment | 13 | 30,000 | – | – | 15,000 | – | – | 100,000 |
| **K** | Fuel Ore | 2 | 40,000 | 20,000 | – | – | 200,000 | – | – |
|       | Organics | 100 | 40,000 | – | 20,000 | – | – | 50,000 | – |
|       | Equipment | 500 | 40,000 | – | – | 20,000 | – | – | 10,000 |
| **O** | Fuel Ore | 20 | 200,000 | 100,000 | – | – | 100,000 | – | – |
|       | Organics | 2 | 200,000 | – | 100,000 | – | – | 1,000,000 | – |
|       | Equipment | 100 | 200,000 | – | – | 100,000 | – | – | 50,000 |
| **L** | Fuel Ore | 2 | 40,000 | 20,000 | – | – | 200,000 | – | – |
|       | Organics | 5 | 40,000 | – | 20,000 | – | – | 200,000 | – |
|       | Equipment | 20 | 40,000 | – | – | 20,000 | – | – | 200,000 |
| **C** | Fuel Ore | 50 | 100,000 | 50,000 | – | – | 20,000 | – | – |
|       | Organics | 100 | 100,000 | – | 50,000 | – | – | 50,000 | – |
|       | Equipment | 500 | 100,000 | – | – | 50,000 | – | – | 10,000 |
| **H** | Fuel Ore | 1 | 100,000 | 50,000 | – | – | 1,000,000 | – | – |
|       | Equipment | 500 | 100,000 | – | – | 50,000 | – | – | 100,000 |
| **U** | (No production) | – | 3,000 | 0 | 0 | 0 | 10,000 | 10,000 | 10,000 |

> **Note:** Daily production follows a bell curve; maximum output occurs at 50 % of the maximum colonist level.

### 2.2 Fighter Production Ratios
Fighter output is a fixed fraction of the daily FOE production for each class:

| Class | Fighter Ratio |
|-------|---------------|
| M | `n/10` |
| K | `n/15` |
| O | `n/15` |
| L | `n/12` |
| C | `n/25` |
| H | `n/50` |
| U | — (no fighters) |

> **Formula Example** (Class M, 1,500 colonists on Fuel Ore):  
> 
