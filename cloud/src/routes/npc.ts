/**
 * NPC tick system — rule-based updates for cloud galaxy NPCs.
 * Runs on Cron Trigger or manual admin invocation.
 */
import type { D1Database } from '@cloudflare/workers-types';
import { json, jsonError } from '../utils/cors.js';

interface NPCRow {
  id: number;
  npc_id: string;
  persona_json: string;
  current_sector: number;
  ship_json: string;
  credits: number;
  cargo_json: string;
  memory_json: string;
}

interface Persona {
  name: string;
  type: 'trader' | 'raider' | 'patrol';
  faction?: 'choam' | 'fremen' | 'sardaukar' | 'guild' | 'independent';
}

interface ShipJson {
  hull: number;
  maxHull: number;
  shield: number;
  weaponDamage?: number;
}

interface TickSummary {
  npcsProcessed: number;
  moves: number;
  trades: number;
  combats: number;
  deaths: number;
  newsGenerated: number;
  llmDecisions: number;
}

interface NPCTickOptions {
  ai?: { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };
  model?: string;
  quoteModel?: string;
  enabled?: boolean;
}

/**
 * Run one tick of NPC activity for a galaxy.
 */
export async function runNPCTick(db: D1Database, galaxyId: number, options?: NPCTickOptions): Promise<TickSummary> {
  const summary: TickSummary = {
    npcsProcessed: 0,
    moves: 0,
    trades: 0,
    combats: 0,
    deaths: 0,
    newsGenerated: 0,
    llmDecisions: 0,
  };

  // Fetch all active NPCs
  const npcResult = await db
    .prepare('SELECT * FROM npcs WHERE galaxy_id = ? AND is_active = 1')
    .bind(galaxyId)
    .all<NPCRow>();

  const npcs = npcResult.results ?? [];
  summary.npcsProcessed = npcs.length;

  // Fetch all sector connections for this galaxy
  const sectorResult = await db
    .prepare('SELECT sector_index, connections_json, port_class, port_inventory_json, danger, stardock FROM sectors WHERE galaxy_id = ?')
    .bind(galaxyId)
    .all<{
      sector_index: number;
      connections_json: string;
      port_class: number | null;
      port_inventory_json: string;
      danger: string;
      stardock: number;
    }>();

  const sectors = new Map<number, {
    connections: number[];
    hasPort: boolean;
    inventory: Record<string, { price: number; supply: number }>;
    danger: string;
    stardock: boolean;
  }>();

  for (const row of sectorResult.results ?? []) {
    sectors.set(row.sector_index, {
      connections: JSON.parse(row.connections_json ?? '[]'),
      hasPort: row.port_class !== null && row.port_class !== undefined,
      inventory: JSON.parse(row.port_inventory_json ?? '{}'),
      danger: row.danger,
      stardock: row.stardock === 1,
    });
  }

  // Process each NPC
  for (const npc of npcs) {
    const persona: Persona = JSON.parse(npc.persona_json);
    const ship: ShipJson = JSON.parse(npc.ship_json);
    const cargo: Record<string, number> = JSON.parse(npc.cargo_json ?? '{}');
    const memory: Record<string, any> = JSON.parse(npc.memory_json ?? '{}');

    const currentSector = sectors.get(npc.current_sector);
    if (!currentSector) continue;

    // Decide action based on persona type
    let actionRoll = Math.random();

    const llmAction = await decideActionWithLLM(options, persona, currentSector);
    if (llmAction) {
      summary.llmDecisions++;
      actionRoll = mapActionToRoll(llmAction, persona.type);
    }

    if (persona.type === 'raider') {
      const isSardaukar = persona.faction === 'sardaukar';
      const isFremen = persona.faction === 'fremen';

      if (isSardaukar) {
        // Sardaukar: 40% move aggressively, 50% attack anything, 10% idle
        if (actionRoll < 0.4) {
          const target = currentSector.connections[Math.floor(Math.random() * currentSector.connections.length)];
          if (target !== undefined) {
            await moveNPC(db, galaxyId, npc.npc_id, target);
            summary.moves++;
          }
        } else if (actionRoll < 0.9) {
          const victim = await findVictim(db, galaxyId, npc.current_sector, npc.npc_id);
          if (victim) {
            summary.combats++;
            const result = await resolveNPCCombat(db, galaxyId, npc, victim, cargo, persona);
            if (result.death) summary.deaths++;
            if (result.news) summary.newsGenerated++;
          }
        }
      } else if (isFremen) {
        // Fremen: 50% patrol sector, 30% attack Sardaukar only, 20% idle
        if (actionRoll < 0.5) {
          const dangerous = currentSector.connections.filter(id => {
            const s = sectors.get(id);
            return s && s.danger === 'dangerous';
          });
          const target = dangerous.length > 0
            ? dangerous[Math.floor(Math.random() * dangerous.length)]
            : currentSector.connections[Math.floor(Math.random() * currentSector.connections.length)];
          if (target !== undefined) {
            await moveNPC(db, galaxyId, npc.npc_id, target);
            summary.moves++;
          }
        } else if (actionRoll < 0.8) {
          // Attack Sardaukar specifically
          const victim = await findSardaukar(db, galaxyId, npc.current_sector, npc.npc_id);
          if (victim) {
            summary.combats++;
            const result = await resolveNPCCombat(db, galaxyId, npc, victim, cargo, persona);
            if (result.death) summary.deaths++;
            if (result.news) summary.newsGenerated++;
          }
        }
      } else {
        // Generic raider
        if (actionRoll < 0.6) {
          const dangerous = currentSector.connections.filter(id => {
            const s = sectors.get(id);
            return s && s.danger === 'dangerous';
          });
          const target = dangerous.length > 0
            ? dangerous[Math.floor(Math.random() * dangerous.length)]
            : currentSector.connections[Math.floor(Math.random() * currentSector.connections.length)];
          if (target !== undefined) {
            await moveNPC(db, galaxyId, npc.npc_id, target);
            summary.moves++;
          }
        } else if (actionRoll < 0.9) {
          const victim = await findVictim(db, galaxyId, npc.current_sector, npc.npc_id);
          if (victim) {
            summary.combats++;
            const result = await resolveNPCCombat(db, galaxyId, npc, victim, cargo, persona);
            if (result.death) summary.deaths++;
            if (result.news) summary.newsGenerated++;
          }
        }
      }
    } else if (persona.type === 'patrol') {
      // Patrols: 70% move toward safe/caution, 20% attack raiders, 10% idle
      if (actionRoll < 0.7) {
        const safer = currentSector.connections.filter(id => {
          const s = sectors.get(id);
          return s && (s.danger === 'safe' || s.danger === 'caution');
        });
        const target = safer.length > 0
          ? safer[Math.floor(Math.random() * safer.length)]
          : currentSector.connections[Math.floor(Math.random() * currentSector.connections.length)];
        if (target !== undefined) {
          await moveNPC(db, galaxyId, npc.npc_id, target);
          summary.moves++;
        }
      } else if (actionRoll < 0.9) {
        const victim = await findSardaukar(db, galaxyId, npc.current_sector, npc.npc_id);
        if (victim) {
          summary.combats++;
          const result = await resolveNPCCombat(db, galaxyId, npc, victim, cargo, persona);
          if (result.death) summary.deaths++;
          if (result.news) summary.newsGenerated++;
        }
      }
    } else {
      // Traders: 60% move, 30% trade if at port, 10% idle
      if (actionRoll < 0.6) {
        const target = currentSector.connections[Math.floor(Math.random() * currentSector.connections.length)];
        if (target !== undefined) {
          await moveNPC(db, galaxyId, npc.npc_id, target);
          summary.moves++;
        }
      } else if (actionRoll < 0.9 && currentSector.hasPort) {
        // Simple trade: buy random commodity, sell random commodity
        const commodities = Object.keys(currentSector.inventory);
        const commodity = commodities[Math.floor(Math.random() * commodities.length)];
        const inv = commodity ? currentSector.inventory[commodity] : undefined;
        if (inv && inv.supply > 10) {
          const quantity = Math.min(10, inv.supply);
          const cost = inv.price * quantity;
          if (npc.credits >= cost) {
            cargo[commodity] = (cargo[commodity] ?? 0) + quantity;
            inv.supply -= quantity;
            inv.price = Math.round(inv.price * 1.02);
            await updateNPCCargoAndCredits(db, galaxyId, npc.npc_id, cargo, npc.credits - cost);
            await updateSectorInventory(db, galaxyId, npc.current_sector, currentSector.inventory);
            summary.trades++;
          }
        }
      }
    }

    // Update memory
    memory.lastAction = { type: actionRoll < 0.6 ? 'move' : actionRoll < 0.9 ? 'action' : 'idle', at: new Date().toISOString() };
    await updateNPCMemory(db, galaxyId, npc.npc_id, memory);
  }

  return summary;
}

async function moveNPC(db: D1Database, galaxyId: number, npcId: string, sectorId: number): Promise<void> {
  await db
    .prepare('UPDATE npcs SET current_sector = ?, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
    .bind(sectorId, galaxyId, npcId)
    .run();
}

async function updateNPCCargoAndCredits(db: D1Database, galaxyId: number, npcId: string, cargo: Record<string, number>, credits: number): Promise<void> {
  await db
    .prepare('UPDATE npcs SET cargo_json = ?, credits = ?, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
    .bind(JSON.stringify(cargo), credits, galaxyId, npcId)
    .run();
}

async function updateNPCMemory(db: D1Database, galaxyId: number, npcId: string, memory: Record<string, any>): Promise<void> {
  await db
    .prepare('UPDATE npcs SET memory_json = ?, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
    .bind(JSON.stringify(memory), galaxyId, npcId)
    .run();
}

async function updateSectorInventory(db: D1Database, galaxyId: number, sectorId: number, inventory: Record<string, any>): Promise<void> {
  await db
    .prepare('UPDATE sectors SET port_inventory_json = ? WHERE galaxy_id = ? AND sector_index = ?')
    .bind(JSON.stringify(inventory), galaxyId, sectorId)
    .run();
}

async function findVictim(db: D1Database, galaxyId: number, sectorId: number, excludeNpcId: string): Promise<NPCRow | null> {
  const result = await db
    .prepare('SELECT * FROM npcs WHERE galaxy_id = ? AND current_sector = ? AND is_active = 1 AND npc_id != ? ORDER BY RANDOM() LIMIT 1')
    .bind(galaxyId, sectorId, excludeNpcId)
    .first<NPCRow>();
  return result ?? null;
}

async function findRaider(db: D1Database, galaxyId: number, sectorId: number, excludeNpcId: string): Promise<NPCRow | null> {
  const result = await db
    .prepare("SELECT * FROM npcs WHERE galaxy_id = ? AND current_sector = ? AND is_active = 1 AND npc_id != ? AND persona_json LIKE '%raider%' ORDER BY RANDOM() LIMIT 1")
    .bind(galaxyId, sectorId, excludeNpcId)
    .first<NPCRow>();
  return result ?? null;
}

async function findSardaukar(db: D1Database, galaxyId: number, sectorId: number, excludeNpcId: string): Promise<NPCRow | null> {
  const result = await db
    .prepare("SELECT * FROM npcs WHERE galaxy_id = ? AND current_sector = ? AND is_active = 1 AND npc_id != ? AND persona_json LIKE '%sardaukar%' ORDER BY RANDOM() LIMIT 1")
    .bind(galaxyId, sectorId, excludeNpcId)
    .first<NPCRow>();
  return result ?? null;
}

interface CombatResult {
  death: boolean;
  news: boolean;
}

async function resolveNPCCombat(db: D1Database, galaxyId: number, attacker: NPCRow, defender: NPCRow, attackerCargo: Record<string, number>, attackerPersona: Persona): Promise<CombatResult> {
  const attackerShip: ShipJson = JSON.parse(attacker.ship_json);
  const defenderShip: ShipJson = JSON.parse(defender.ship_json);

  const attackerDmg = attackerShip.weaponDamage ?? 5;
  const defenderDmg = defenderShip.weaponDamage ?? 5;

  const newDefenderHull = Math.max(0, defenderShip.hull - attackerDmg);
  const newAttackerHull = Math.max(0, attackerShip.hull - defenderDmg);

  const defenderDied = newDefenderHull <= 0;
  const attackerDied = newAttackerHull <= 0;

  // Update defender
  if (defenderDied) {
    await db
      .prepare('UPDATE npcs SET is_active = 0, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
      .bind(galaxyId, defender.npc_id)
      .run();
  } else {
    const updatedDefenderShip = { ...defenderShip, hull: newDefenderHull };
    await db
      .prepare('UPDATE npcs SET ship_json = ?, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
      .bind(JSON.stringify(updatedDefenderShip), galaxyId, defender.npc_id)
      .run();
  }

  // Update attacker
  if (attackerDied) {
    await db
      .prepare('UPDATE npcs SET is_active = 0, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
      .bind(galaxyId, attacker.npc_id)
      .run();
  } else {
    const updatedAttackerShip = { ...attackerShip, hull: newAttackerHull };
    await db
      .prepare('UPDATE npcs SET ship_json = ?, updated_at = datetime("now") WHERE galaxy_id = ? AND npc_id = ?')
      .bind(JSON.stringify(updatedAttackerShip), galaxyId, attacker.npc_id)
      .run();
  }

  // Generate news if someone died
  let news = false;
  if (defenderDied || attackerDied) {
    const defenderPersona: Persona = JSON.parse(defender.persona_json);
    const headline = defenderDied && attackerDied
      ? `${factionPrefix(attackerPersona)}${attackerPersona.name} and ${factionPrefix(defenderPersona)}${defenderPersona.name} destroyed each other in sector ${attacker.current_sector}`
      : defenderDied
      ? `${factionPrefix(attackerPersona)}${attackerPersona.name} destroyed ${factionPrefix(defenderPersona)}${defenderPersona.name} in sector ${attacker.current_sector}`
      : `${factionPrefix(defenderPersona)}${defenderPersona.name} destroyed ${factionPrefix(attackerPersona)}${attackerPersona.name} in sector ${attacker.current_sector}`;

    await db
      .prepare('INSERT INTO news (galaxy_id, headline, type, sector_id) VALUES (?, ?, ?, ?)')
      .bind(galaxyId, headline, 'combat', attacker.current_sector)
      .run();
    news = true;
  }

  return { death: defenderDied || attackerDied, news };
}

/**
 * HTTP handler for manual/admin NPC tick.
 */
export async function handleNPCTick(
  request: Request,
  db: D1Database,
  adminSecret: string | undefined,
  options?: NPCTickOptions
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed', 405);

  // Admin secret check
  const providedSecret = request.headers.get('X-Admin-Secret');
  if (!adminSecret || providedSecret !== adminSecret) {
    return jsonError('Forbidden', 403);
  }

  let body: { galaxyId?: number };
  try {
    body = await request.json();
  } catch {
    body = { galaxyId: 1 };
  }

  const galaxyId = body.galaxyId ?? 1;
  const summary = await runNPCTick(db, galaxyId, options);
  return json(summary);
}

/**
 * Admin-only LLM health check endpoint.
 * Returns a lore-themed quote to verify model connectivity.
 */
export async function handleNPCLLMHealth(
  request: Request,
  adminSecret: string | undefined,
  options?: NPCTickOptions
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') return jsonError('Method not allowed', 405);

  const providedSecret = request.headers.get('X-Admin-Secret');
  if (!adminSecret || providedSecret !== adminSecret) {
    return jsonError('Forbidden', 403);
  }

  if (!options?.enabled || !options.ai) {
    return json({ ok: false, enabled: false, message: 'NPC_LLM_ENABLED is false or AI binding unavailable.' }, 200);
  }

  const debug = new URL(request.url).searchParams.get('debug') === '1';
  const model = options.quoteModel ?? options.model ?? '@cf/qwen/qwen3-30b-a3b-fp8';
  try {
    const result = await options.ai.run(model, {
      prompt: 'Return one single-line in-universe TW 3002 quote (max 18 words) about trade, raiders, warp lanes, and survival in The Void. Output only the quote text.',
      max_tokens: 32,
      temperature: 0.8,
    });

    const raw = extractAIText(result).trim();
    const withoutThink = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const firstLine = (withoutThink || raw).split('\n').map(s => s.trim()).find(Boolean) ?? '';
    const quote = firstLine.slice(0, 200);

    const payload: Record<string, unknown> = {
      ok: quote.length > 0,
      enabled: true,
      model,
      quote,
      at: new Date().toISOString(),
    };

    if (debug) {
      const obj = result && typeof result === 'object' ? (result as Record<string, unknown>) : null;
      payload.debug = {
        keys: obj ? Object.keys(obj) : [],
        extractedTextLength: raw.length,
        rawPreview: safePreview(result),
      };
    }

    return json(payload);
  } catch (err) {
    return json({
      ok: false,
      enabled: true,
      model,
      error: err instanceof Error ? err.message : 'Unknown AI error',
      at: new Date().toISOString(),
    }, 500);
  }
}

function mapActionToRoll(action: 'move' | 'combat' | 'trade' | 'idle', type: Persona['type']): number {
  if (action === 'move') return 0.2;
  if (action === 'idle') return 0.95;
  if (action === 'trade') return type === 'trader' ? 0.75 : 0.95;
  return 0.75; // combat
}

async function decideActionWithLLM(
  options: NPCTickOptions | undefined,
  persona: Persona,
  sector: { danger: string; hasPort: boolean; connections: number[] }
): Promise<'move' | 'combat' | 'trade' | 'idle' | null> {
  if (!options?.enabled || !options.ai) return null;

  const model = options.model ?? '@cf/qwen/qwen3-30b-a3b-fp8';
  try {
    const prompt = `You choose one action for an NPC in a space trading game. Reply with JSON only: {"action":"move|combat|trade|idle"}.\nNPC: ${persona.type} (${persona.faction ?? 'independent'})\nSector danger: ${sector.danger}\nHas port: ${sector.hasPort}\nWarp exits: ${sector.connections.length}`;

    const result = await options.ai.run(model, {
      prompt,
      max_tokens: 48,
      temperature: 0.4,
    });

    const text = extractAIText(result).trim();
    if (!text) return null;

    return parseActionFromText(text);
  } catch {
    return null;
  }
}

export async function handleNPCModelBenchmark(
  request: Request,
  adminSecret: string | undefined,
  options?: NPCTickOptions
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') return jsonError('Method not allowed', 405);

  const providedSecret = request.headers.get('X-Admin-Secret');
  if (!adminSecret || providedSecret !== adminSecret) return jsonError('Forbidden', 403);
  if (!options?.enabled || !options.ai) {
    return json({ ok: false, enabled: false, message: 'NPC_LLM_ENABLED is false or AI binding unavailable.' }, 200);
  }

  const url = new URL(request.url);
  const modelsParam = url.searchParams.get('models');
  const models = (modelsParam ? modelsParam.split(',') : [options.model ?? '@cf/qwen/qwen3-30b-a3b-fp8'])
    .map(m => m.trim())
    .filter(Boolean);

  const decisionRuns = Math.max(1, Math.min(50, Number(url.searchParams.get('decisionRuns') ?? '10')));
  const quoteRuns = Math.max(1, Math.min(20, Number(url.searchParams.get('quoteRuns') ?? '5')));

  const results: Array<Record<string, unknown>> = [];

  for (const model of models) {
    let decisionParseable = 0;
    let decisionErrors = 0;
    let decisionLatencyTotal = 0;

    for (let i = 0; i < decisionRuns; i++) {
      const t0 = Date.now();
      try {
        const prompt = `You choose one action for an NPC in a space trading game. Reply with JSON only: {"action":"move|combat|trade|idle"}.\nNPC: trader (independent)\nSector danger: caution\nHas port: true\nWarp exits: 4`;
        const res = await options.ai.run(model, { prompt, max_tokens: 48, temperature: 0.3 });
        const txt = extractAIText(res).trim();
        if (parseActionFromText(txt)) decisionParseable++;
      } catch {
        decisionErrors++;
      } finally {
        decisionLatencyTotal += Date.now() - t0;
      }
    }

    let quoteNonEmpty = 0;
    let quoteErrors = 0;
    let quoteLatencyTotal = 0;
    const quoteSamples: string[] = [];

    for (let i = 0; i < quoteRuns; i++) {
      const t0 = Date.now();
      try {
        const quoteModel = options.quoteModel ?? model;
        const res = await options.ai.run(quoteModel, {
          prompt: 'Return one single-line in-universe TW 3002 quote (max 18 words) about trade, raiders, warp lanes, and survival in The Void. Output only the quote text.',
          max_tokens: 32,
          temperature: 0.8,
        });
        const raw = extractAIText(res).trim();
        const quote = raw.split('\n').map(s => s.trim()).find(Boolean) ?? '';
        if (quote) {
          quoteNonEmpty++;
          if (quoteSamples.length < 3) quoteSamples.push(quote.slice(0, 180));
        }
      } catch {
        quoteErrors++;
      } finally {
        quoteLatencyTotal += Date.now() - t0;
      }
    }

    results.push({
      model,
      decisionRuns,
      decisionParseable,
      decisionParseRate: Number((decisionParseable / decisionRuns).toFixed(3)),
      decisionErrors,
      decisionAvgLatencyMs: Math.round(decisionLatencyTotal / decisionRuns),
      quoteRuns,
      quoteNonEmpty,
      quoteNonEmptyRate: Number((quoteNonEmpty / quoteRuns).toFixed(3)),
      quoteErrors,
      quoteAvgLatencyMs: Math.round(quoteLatencyTotal / quoteRuns),
      quoteModel: options.quoteModel ?? model,
      quoteSamples,
      score: Number((((decisionParseable / decisionRuns) * 0.8) + ((quoteNonEmpty / quoteRuns) * 0.2)).toFixed(3)),
    });
  }

  results.sort((a, b) => Number((b.score as number) - (a.score as number)));

  return json({
    ok: true,
    enabled: true,
    decisionRuns,
    quoteRuns,
    ranked: results,
    winner: results[0] ?? null,
    at: new Date().toISOString(),
  });
}

function parseActionFromText(text: string): 'move' | 'combat' | 'trade' | 'idle' | null {
  if (!text) return null;
  let action: string | undefined;
  try {
    action = (JSON.parse(text) as { action?: string }).action;
  } catch {}
  if (action === 'move' || action === 'combat' || action === 'trade' || action === 'idle') return action;

  const lower = text.toLowerCase();
  if (lower.includes('"action":"move"') || lower.includes("'action':'move'")) return 'move';
  if (lower.includes('"action":"combat"') || lower.includes("'action':'combat'")) return 'combat';
  if (lower.includes('"action":"trade"') || lower.includes("'action':'trade'")) return 'trade';
  if (lower.includes('"action":"idle"') || lower.includes("'action':'idle'")) return 'idle';
  const wordMatch = lower.match(/\b(move|combat|trade|idle)\b/);
  if (wordMatch?.[1] === 'move' || wordMatch?.[1] === 'combat' || wordMatch?.[1] === 'trade' || wordMatch?.[1] === 'idle') {
    return wordMatch[1];
  }
  return null;
}

function safePreview(result: unknown): string {
  try {
    return JSON.stringify(result).slice(0, 1200);
  } catch {
    return String(result).slice(0, 1200);
  }
}

function extractAIText(result: unknown): string {
  if (!result || typeof result !== 'object') return '';
  const r = result as Record<string, any>;

  if (typeof r.response === 'string') return r.response;
  if (typeof r.output_text === 'string') return r.output_text;
  if (typeof r.text === 'string') return r.text;

  const choiceText = r.choices?.[0]?.text;
  if (typeof choiceText === 'string') return choiceText;

  const choiceContent = r.choices?.[0]?.message?.content;
  if (typeof choiceContent === 'string') return choiceContent;
  if (Array.isArray(choiceContent)) {
    const t = choiceContent.map((c: any) => (typeof c?.text === 'string' ? c.text : '')).join(' ').trim();
    if (t) return t;
  }

  return '';
}

function factionPrefix(persona: Persona): string {
  switch (persona.faction) {
    case 'fremen': return 'Fremen warrior ';
    case 'sardaukar': return 'Sardaukar ';
    case 'choam': return 'CHOAM ';
    case 'guild': return 'Guild ';
    default: return '';
  }
}
