# 03-05-SUMMARY — Response Caching

**Status:** ✅ COMPLETE
**Executed:** 2026-04-23
**Duration:** ~15 min

## What Was Built

### `packages/engine/src/llm/cache.ts`

**`DecisionCache` class:**
- LRU cache with configurable `maxSize` (default 100) and `ttlMs` (default 30s)
- `get(key)` — returns entry if present and not expired, tracks hits/misses
- `set(key, entry)` — stores entry, evicts oldest if at capacity
- `getStats()` — returns `{ hits, misses, size, hitRate }`
- `clear()` — wipes cache and resets stats

**`globalCache`** — module-level singleton (one per session)

**`canUseCache(npc, players)`** — cache eligibility check:
- ❌ Player in same sector (volatile)
- ❌ NPC hull < 50% (desperate)
- ❌ New grudge within last minute (emotional)
- ✅ Otherwise: cache allowed

**`makeCacheKey(npc, galaxy, players)`** — cache key builder:
- Coarsens values (hull rounded to 10% buckets)
- Includes: type, danger level, player presence, hull%, shield%, cargo total, grudge status, last action type

### Cache Integration (`packages/engine/src/npcs/brain.ts`)

`decideAction()` now:
1. Checks `canUseCache()` before LLM call
2. Looks up `globalCache.get(cacheKey)`
3. On cache hit: returns cached action instantly, records "Cached: ..." in memory
4. On cache miss: calls LLM as before
5. On successful parse: stores result in cache for future hits

### Exports

- `globalCache`, `DecisionCache`, `CacheEntry` exported from engine index

### Files Changed

```
packages/engine/src/llm/cache.ts       (NEW)
packages/engine/src/npcs/brain.ts      (+cache checks in decideAction)
packages/engine/src/index.ts           (+cache exports)
```

## Verification Results

- ✅ Engine typecheck clean
- ✅ CLI typecheck clean
- ✅ Binary builds successfully (~100MB)
- ✅ Cache bypasses for player-in-sector situations
- ✅ Cache bypasses for low-hull NPCs
- ✅ Cache bypasses for recently-grudged NPCs
- ✅ LRU eviction at capacity
- ✅ TTL expiration
- ✅ Stats tracking (hits, misses, hitRate)

## Notes

- **Session-level only.** Cache lives in memory, dies when process exits. No persistence needed — each login is a fresh session.
- **Cache key coarseness** means minor damage (e.g., 95% → 94% hull) won't bust the cache, but major damage (95% → 80%) will.
- **With 15 active NPCs per tick and typical galaxy layouts, expect 30-50% cache hit rate** on subsequent ticks since many NPCs in similar situations share cache keys.
- **Mock provider benefits too** — even deterministic responses get cached, reducing function call overhead.
