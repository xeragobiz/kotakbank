# 10 · Create Workflow 🟡

> **Guardrail — this repo has NO AEM Workflow engine.** "Workflow" here means CI automation (GitHub Actions) and the push → Code Sync publish process. Use the traditional path only on a real AEMaaCS project with a workflow engine.

## Variables
- `{{WORKFLOW_PURPOSE}}` — what should be automated, e.g. "lint + JSON-sync on push", "notify on PR", "activate on approval"
- `{{TRIGGER}}` — when it runs (push, PR, schedule, content event)
- `{{STEPS}}` — the steps to perform
- `{{STACK}}` — `eds` or `aemaacs`

## Prompt
```
I want to automate: {{WORKFLOW_PURPOSE}} — trigger: {{TRIGGER}}, steps: {{STEPS}}.

FIRST detect the stack (or use STACK={{STACK}}):
- If Edge Delivery Services (THIS repo): do NOT create AEM workflow models/launchers (docs/skills/06-workflow.md).
  Implement automation as a GitHub Actions workflow under .github/workflows/ (model it on main.yaml:
  npm ci → npm run lint → regenerate JSON and `git diff --exit-code` the aggregates). Keep the JSON-sync gate intact.
  Publishing/activation is handled by AEM Code Sync on push — do not script a deploy. Renovate handles dependency PRs.
- Only if traditional AEMaaCS: create a Workflow model + launcher, with WorkflowProcess step(s) for {{STEPS}},
  triggered on {{TRIGGER}}, following AEM workflow best practices (idempotent steps, error handling, no long-running sync work).

State the detected stack first. For the EDS path, ensure `gh pr checks` stays meaningful and green.
```

## Validation (EDS path)
- [ ] No AEM workflow-engine artifacts; automation is a GitHub Actions YAML.
- [ ] JSON-sync + lint gates preserved; no manual deploy scripted; `gh pr checks` green.
