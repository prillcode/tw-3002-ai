/**
 * Prompt builder for NPC LLM decisions.
 */
import type { Galaxy } from '../types.js';
import type { NPC, NPCAction } from '../npcs/types.js';
import type { PlayerShip } from '../ships/upgrades.js';
import { getNeighborIds } from '../galaxy/generator.js';

export const SYSTEM_PROMPT = `You are an NPC in a space trading game called TW 3002 AI.
You must respond with ONLY a valid JSON object. No markdown, no explanations outside the JSON.

Your response must match this schema:
{
  "action": "move" | "trade" | "attack" | "flee" | "idle",
  "params": { ...action-specific fields... },
  "reasoning": "brief in-character thought (1 sentence)"
}

Action param schemas:
- move:    { "targetSector": number }
- trade:   { "commodity": "ore"|"organics"|"equipment", "direction": "buy"|"sell", "quantity": number }
- attack:  { "targetId": string }
- flee:    { "targetId": string }
- idle:    {}`;

/**
 * Build a user prompt for an NPC decision.
 */
export function buildPrompt(npc: NPC, galaxy: Galaxy, players: PlayerShip[]): string {
  const sector = galaxy.sectors.get(npc.currentSectorId);
  const sectorName = sector?.name ?? `Sector ${npc.currentSectorId}`;
  const danger = sector?.danger ?? 'unknown';

  const playerHere = players.find(p => p.currentSector === npc.currentSectorId);
  const neighbors = getNeighborIds(galaxy, npc.currentSectorId);

  const cargoSummary = Object.entries(npc.cargo)
    .filter(([, amt]) => amt > 0)
    .map(([c, amt]) => `${c}: ${amt}`)
    .join(', ') || 'empty';

  const memorySummary = npc.memory.lastActions.length > 0
    ? npc.memory.lastActions.map(a => `- ${a.result}`).join('\n')
    : 'None yet';

  const grudgeSummary = npc.memory.grudges.length > 0
    ? npc.memory.grudges.map(g => `- ${g.targetName}: ${g.reason} (severity ${g.severity})`).join('\n')
    : 'None';

  const allianceSummary = npc.memory.alliances.length > 0
    ? npc.memory.alliances.map(a => `- ${a.targetName}`).join('\n')
    : 'None';

  const rep = playerHere ? npc.memory.reputation?.['player'] : null;
  const reputationSummary = rep
    ? `Reputation with player: ${rep.score > 0 ? '+' : ''}${rep.score} (${rep.interactions} interactions)`
    : 'No prior interactions with player.';

  const marketSummary = npc.memory.marketObservations.length > 0
    ? npc.memory.marketObservations.slice(-3).map(o => `- Sector ${o.sectorId}: ${o.commodity} @ ${o.price} credits`).join('\n')
    : 'None';

  const playerSummary = playerHere
    ? `Player ship "${playerHere.name}" detected in sector. Hull: ${playerHere.hull}/${playerHere.maxTurns > 0 ? 100 : 100}`
    : 'No player ships nearby.';

  const portSummary = sector?.port
    ? `Port: ${sector.port.name} (Class ${sector.port.class})`
    : 'No port in this sector.';

  return `You are ${npc.persona.name}, a ${npc.persona.type}.
Personality: ${npc.persona.flavor}
Aggression: ${npc.persona.aggression.toFixed(2)}/1.0 | Caution: ${npc.persona.caution.toFixed(2)}/1.0 | Greed: ${npc.persona.greed.toFixed(2)}/1.0

Current state:
- Sector: ${sectorName} (${danger} zone)
- Hull: ${Math.round(npc.ship.hull)}/${npc.ship.maxHull}
- Shield: ${Math.round(npc.ship.shield)}/${npc.ship.maxShield}
- Credits: ${Math.round(npc.credits)}
- Cargo: ${cargoSummary}
- Weapon damage: ${npc.ship.weaponDamage}
- Neighboring sectors: [${neighbors.join(', ')}]

Recent memory (last 3 actions):
${memorySummary}

Grudges:
${grudgeSummary}

Alliances:
${allianceSummary}

${reputationSummary}

Market knowledge (last 3 observations):
${marketSummary}

Nearby:
${playerSummary}
${portSummary}

What do you do? Respond with JSON only.`;
}

/**
 * Build a system prompt variant for a specific NPC type.
 */
export function buildSystemPromptForType(type: NPC['persona']['type']): string {
  const typeHints: Record<string, string> = {
    trader: 'You are a trader. Prioritize profitable trades. Avoid combat unless cornered.',
    raider: 'You are a raider. Attack weak targets. Flee if outmatched. Profit from plunder.',
    patrol: 'You are a patrol officer. Protect lawful space. Attack pirates. Help traders.',
  };
  return `${SYSTEM_PROMPT}\n\n${typeHints[type] ?? ''}`;
}
