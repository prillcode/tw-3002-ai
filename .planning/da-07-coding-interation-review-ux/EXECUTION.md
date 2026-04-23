# Execution — DA-07 Phase 02: Coding Runner Continuation Behavior

## Objective
Harden the coding runner's iteration behavior so follow-up coding runs are clearly distinguished, feedback lifecycle is explicit, and diagnostics support timeline/UX differentiation.

## Key Constraints
- Work happens in `/home/prill/dev/dash-ai` (not this repo)
- Do NOT wipe the DB or run `pnpm db:generate`; add manual migrations only if needed
- Phase 01 is already committed (`b268910`); build on top of it
- Phase 02 is refinement, not greenfield — the runner already passes `codingFeedback` into prompts
- Verify with `pnpm build` after all changes

## Relevant Files
- `packages/server/src/agent/codingRunner.ts`
- `packages/server/src/services/queueWorker.ts`
- `packages/server/src/services/taskService.ts`
- `packages/server/src/routes/tasks.ts`
- `packages/server/src/db/schema.ts`

## Plan

### 1. Audit current iteration prompt contract
- Read `codingRunner.ts` prompt construction (already read — confirmed it has conditional `codingFeedback` block).
- Current state: prompt already says "This is a follow-up coding iteration" vs "This is the initial coding run" and passes feedback.
- **Gap**: no explicit `isIteration` flag in the `CodingRunnerInput` or in event payloads; diagnostics don't tag runs as fresh vs iterative.

### 2. Add `isIteration` flag to CodingRunnerInput
- Add `isIteration?: boolean` to the `CodingRunnerInput` interface.
- In the session launch event (`status: "launching"`), emit `isIteration: true/false` so the timeline can distinguish runs.

### 3. Decide and implement codingFeedback clearing strategy
- **Recommended**: Clear `codingFeedback` when the coding run **starts** (not on success). Reason: feedback is consumed at prompt-construction time; holding it after launch serves no purpose and risks stale data if the run fails and user retries.
- Implement: In `queueWorker.ts` `runTaskSession()`, after reading the task and before calling `runCodingSession()`, call `taskService.clearCodingFeedback(task.id)` (new helper) to null out the field.
- Add `clearCodingFeedback(taskId: string)` to `taskService.ts`.
- This means: user submits feedback → task goes to QUEUED with feedback → worker claims it → reads feedback → clears feedback → runs coder with feedback in memory.

### 4. Strengthen iteration prompt language
- When `codingFeedback` is present and `isIteration` is true, make the prompt more explicit:
  - Tell the agent that previous coding changes already exist in the repo.
  - Instruct it to `git diff` or read current file state before making changes.
  - Emphasize "continue from current state, do not redo completed work."
- When `isIteration` is false (fresh run), keep existing initial-run prompt but add "Start fresh — no prior coding changes should exist."

### 5. Add iteration diagnostics to events
- In the `CODING_EVENT` with `status: "summary"`, include:
  - `isIteration: boolean`
  - `hadFeedback: boolean` (whether feedback was provided, even if cleared before run)
- In the `CODING_EVENT` with `status: "launching"`, include `isIteration: boolean`.

### 6. Wire isIteration through queueWorker
- In `runTaskSession()`, determine `isIteration` from whether `task.codingFeedback` is non-null/non-empty before clearing it.
- Pass `isIteration` to `runCodingSession()` input.

### 7. Build verification
- Run `pnpm build` in `/home/prill/dev/dash-ai`.
- Fix any type errors.

## Verification
- [ ] `CodingRunnerInput` has `isIteration` field
- [ ] `taskService.clearCodingFeedback()` exists and is called before run start
- [ ] `codingFeedback` is null after a coding run starts (checked via DB or API)
- [ ] Launch and summary events include `isIteration` flag
- [ ] Iteration prompt language explicitly references existing repo changes
- [ ] `pnpm build` passes
