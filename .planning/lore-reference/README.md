# TW 3002 AI — Lore Reference Archive

> Historical reference documentation for TradeWars 2002, preserved for design inspiration and community value.

---

## Attribution

This lore archive is derived from the **Stardock Modern Manual**, compiled by the TradeWars 2002 community with contributions from TW Cabal, Gypsy, and others.

- **Source:** [The Stardock](https://www.thestardock.com)
- **Original TOC:** [table_of_contents.md](https://www.thestardock.com/files/ModernManual/table_of_contents.md)
- **License:** Community-compiled reference material. Attribution maintained per original authors.

---

## Purpose

This directory serves three roles in the TW 3002 AI project:

1. **Design Reference** — When implementing a feature (planets, combat, corporations, etc.), cross-reference what TW2002 did. Learn from 30+ years of player-discovered mechanics.
2. **Docs Source** — Content here will be adapted into `playtradewars.net/lore/` as a historical reference section, separate from the game-specific `/guide/`.
3. **Community Archive** — Centralizes scattered TW2002 knowledge into a single, searchable, modern-format repository.

---

## Structure

| Directory | Contents |
|-----------|----------|
| `core/` | Fundamentals, Navigation, Planets, Ports, Ships, Trading, Pod Mechanics |
| `alignment/` | Good Path, Evil Path — alignment mechanics, ranks, commissions |
| `advanced/` | Economy exploits, Planet Creation, TWGS Settings |
| `strategy/` | Blockades, Combat, Corporations, Defense, Invasion |

---

## Key Concepts for TW 3002 AI

### Core Systems We Should Eventually Cover
- **Planets** — Creation, types (M/K/O/L/C/H/U), citadels, fighter production, colonization
- **Ships** — Multiple classes, cloaking, TransWarp drives, furbing (repair/restock)
- **Alignment** — Good vs Evil paths, rank progression, ISS (Imperial Star Ship)
- **Corporations** — Team play, role splitting, shared assets
- **Advanced Combat** — Fighters, Q-Cannons, photon torpedoes, limpet mines, blockades
- **Economy** — Paired-port trading, SSM/SST/SDT/RTR loops, planet farming

### Systems We May Simplify or Skip
- **TWGS Settings** — Server configuration for BBS hosting; irrelevant to our cloud architecture
- **Macro-Based Penetration** — BBS-era automation; our web client handles UI natively
- **MBBS-Only Mechanics** — Specific to Major BBS software versions

---

## Usage Notes

- Content is copied verbatim where practical, with minor typo corrections.
- Markdown formatting preserved for direct rendering in Astro.
- When adapting for `playtradewars.net`, summarize aggressively — these are dense reference docs, not player guides.
- Always attribute the original Stardock compilation when publishing.

---

*Compiled for the TW 3002 AI project. Long live the TradeWars.*
