# DA-07 — Coding Iteration Review UX (Phase 02 Continuation)

## Type
Enhancement

## Objective
Continue DA-07 in the dash-ai repo. Phase 01 (committed in `b268910`) established explicit coding queueing, persisted `coding_feedback`, and a continue-with-feedback flow. Phase 02 deepens the coding runner continuation behavior: tighten the iteration prompt contract, add diagnostics distinguishing fresh vs iterative runs, and decide on feedback lifecycle (when to clear `coding_feedback`).

## Scope
- Audit and refine `codingRunner.ts` prompt for iteration awareness
- Decide and implement `codingFeedback` clearing strategy (on run start? on success? only when replaced?)
- Add iteration-diagnostics events so timeline/UI can show fresh vs follow-up coding runs
- Ensure queue worker passes iteration context correctly
- Verify with `pnpm build` in dash-ai repo

## Out of Scope
- Phase 03 (review action UX refresh — approve/reject replacement)
- Phase 04 (diff panel → changed-files summary)
- New database migrations (unless feedback lifecycle requires a field)
- Client-side UI changes beyond consuming new event diagnostics

## Relevant Files
- `packages/server/src/agent/codingRunner.ts` — iteration prompt contract, event diagnostics
- `packages/server/src/services/queueWorker.ts` — passes feedback into runner
- `packages/server/src/services/taskService.ts` — feedback persistence, clearing logic
- `packages/server/src/routes/tasks.ts` — iterate-coding endpoint
- `packages/server/src/db/schema.ts` — task fields

## Context
- Branch: `main` (dash-ai repo at `/home/prill/dev/dash-ai`)
- Phase 01 commit: `b268910`
- Source plan: `/home/prill/dev/dash-ai/.planning/DA-07-coding-iteration-review-ux/phases/02-01-PLAN.md`
- This scaffold is a lightweight continuation plan for the next coding session

## Success Criteria
- [ ] Iterated coding runs reflect user feedback and current repo state predictably
- [ ] `codingFeedback` lifecycle is decided and implemented (clear on start, success, or only replace)
- [ ] Timeline/events clearly distinguish fresh coding from iteration (diagnostic event fields)
- [ ] `pnpm build` passes in dash-ai repo
