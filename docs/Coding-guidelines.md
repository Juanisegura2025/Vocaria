## Coding Guidelines

### Python

* Black formatting (`black --line-length 100`).
* Flake‑8 + Ruff for lint.
* Type hints mandatory; mypy strict.
* One module per domain (e.g., `leads`, `billing`).
* Follow *FastAPI* folder pattern: `routers/`, `services/`, `models/`.

### TypeScript/React

* ESLint `airbnb-typescript` preset.
* Prettier maintained via husky pre‑commit.
* Functional components with hooks; avoid class components.
* State management: React Query + Zustand.

### Commits

Use Conventional Commits:

```
feat(widget): add room-enter listener
fix(api): correct lead email regex
chore(deps): bump react to 18.3
```

### Tests

* 90 % coverage threshold enforced.

### Docs

* Docstrings Google style.
* JSDoc for TS.

### Branching

`main` → prod; feature branches `feat/<scope>`; PRs require review + CI green.
