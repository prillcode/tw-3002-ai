## Base Discovery

### Early‑Game Recon

- Complete the **Zero‑Turn Move (ZTM)** on the first turn to obtain a list of all known dead‑end sectors.
- Export the ZTM data and filter for sectors with **no outgoing warps** (dead ends). These are the highest‑probability base locations.

### Ether Probe Campaign

1. Deploy an ether probe to each dead‑end sector.  
2. Record any **avoid** messages returned (enemy fighters destroyed the probe).  
3. Re‑probe sectors that returned avoids, limiting the search depth to **x hops**.  
4. Sectors that cannot be reached within the hop limit are logged for manual review.  

> **Note:** Share avoid lists among corp members to avoid redundant probes.

### Expanding the Search

- After exhausting dead ends, allocate remaining credits to probe **all unexplored sectors**.  
- Prioritize sectors with the **fewest inbound warps** (e.g., 2 inbound warps over 5).  
- Continuously run a **CIM script** to capture visible port data for later reference.

### Securing the Probe Path

- Drop **at least one fighter** in each sector traversed by the probe.  
  - Prevents other players from probing your route.  
  - Provides tactical footholds for later invasion.  

### Macro for Automated Fighter Clearance


