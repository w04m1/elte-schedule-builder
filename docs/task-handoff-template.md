# Task handoff template

Use this when work pauses, changes hands, or resumes in another session.
Replace the prompts with concrete facts and link the relevant issues, PRs,
commits, and files.

## Status

- **State:** Not started / In progress / Ready for review / Blocked
- **Branch and last commit:**
- **Done:**
- **Left to do:**
- **Uncommitted changes:** None, or list each file and what it's for.

## Acceptance criteria

- [ ] Each observable outcome needed to call this done.
- [ ] Compatibility requirements for saved schedules, shared URLs, calendar
      dates, Tanrend throttling, or deployment, if any apply.

## Verification

| Check               | Result  | Notes                        |
| ------------------- | ------- | ---------------------------- |
| Focused test(s)     | Not run | Exact commands and failures. |
| `npm run check`     | Not run |                              |
| `npm test -- --run` | Not run |                              |
| `npm run build`     | Not run |                              |
| `npm run test:e2e`  | Not run |                              |
| `git diff --check`  | Not run |                              |

Add `npm audit --omit=dev` for dependency changes and the DEMO API smoke check
from `AGENTS.md` for backend changes. Never mark a check as passing unless it
ran against the handed-off revision.

## Deferred risks and decisions

- **Known risks or failing checks:**
- **Deliberately deferred work:**
- **Decisions made, alternatives rejected:**
- **User input or external access still needed:**

## Resume steps

1. Confirm repo, branch, commit, and `git status` match this handoff.
2. Read the linked issue/PR and the listed changed files.
3. Reproduce the last verified state with the focused command above.
4. Pick up the first remaining acceptance criterion.
5. Run the full `AGENTS.md` verification before handing off again.
