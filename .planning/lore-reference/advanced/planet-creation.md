## Planet Creation Mechanics

### 1. Base Creation Probabilities
- Each planet class has a **hard‑coded base probability** that determines its chance to be generated when a GTorp is launched.
- The base probabilities for the stock planet classes (L, O, H, M, U, C) together sum to **100 %**.
- Exact numeric values are defined by the game engine and are not exposed in the documentation; they are fixed per class.

### 2. Modifiers Affecting Effective Probability
Two primary modifiers adjust the base probability when a GTorp is launched:

| Modifier | Effect on Effective Probability |
|----------|-----------------------------------|
| **Sector Planet Count** | Increases the chance of generating a **U‑class** (undesirable) planet as the number of existing planets in the sector rises. At the maximum sector limit the U‑class probability can approach **≈ 98 %**. |
| **Sector Planet Count** (Gold) | Raises the chance of generating a **C‑class (Gold)** planet under the same conditions, though the base probability for Gold planets is low. |

> **Note:** The modifiers apply uniformly; each additional planet in the sector shifts probability weight toward U‑class and, proportionally, toward Gold (C‑class) when the sector is being cleared.

### 3. Optimal Planet Creation Sequence
To maximize the acquisition of desirable Gold (C‑class) planets, launch GTorps **up to the sector limit** before destroying any planets. Then work backwards, destroying the least desirable planet after each launch.

#### Step‑by‑Step Procedure
1. **Launch GTorps equal to the sector’s planet limit** (e.g., 5 GTorps if the sector allows 5 planets).  
2. **Identify the worst remaining planet** (U‑class first, then M, L, O, H, finally C).  
3. **Destroy (ZDY) that planet**.  
4. **Launch an additional GTorp** to replace the destroyed planet, keeping the sector at its maximum planet count.  
5. **Repeat steps 2‑4** until all desired Gold planets are generated or resources are exhausted.

#### Example Walkthrough (5‑planet sector)

| Launch # | Planet Class after Launch | Action Taken |
|----------|---------------------------|--------------|
| 1        | M                         | – |
| 2        | M                         | – |
| 3        | U                         | ZDY U |
| 4        | H                         | – |
| 5        | C (Gold)                  | – |
| 6        | M                         | ZDY M |
| 7        | M                         | – |
| 8        | L                         | – |
| 9        | H                         | – |
|10        | C (Gold)                  | – |

After each ZDY, a new GTorp is launched to maintain the sector at five planets, progressively eliminating the lowest‑value planets and raising the odds of retaining Gold planets.

### 4. Data Collection Methodology
Players can empirically determine the exact base probabilities and modifier magnitudes by:

1. **Launching and destroying planets individually** for a large sample size (≈ 300–500 launches per class).  
2. Recording the frequency of each planet class appearance.  
3. Analyzing the data to isolate the **base probability** (observed when the sector is empty) and the **modifier effect** (observed as planet count increases).

> **Caution:** This process requires a **stock game environment** (no custom planet settings) and, optionally, a separate run with a different number of Gold planets to compare modifier behavior.

### 5. Summary of Key Points
- Base probabilities are fixed per planet class and sum to 100 %.  
- Adding planets to a sector strongly favors **U‑class** generation; at full capacity U‑class can reach **≈ 98 %**.  
- Gold (C‑class) planets benefit from the same planet‑count modifier, increasing their likelihood in crowded sectors.  
- The most efficient method to harvest Gold planets is to **launch to sector capacity first**, then **systematically destroy the worst remaining planet** after each launch, preserving a “clean” sector for subsequent GTorps.  
- Accurate probability data can be obtained only through extensive empirical testing in a vanilla game setting.


