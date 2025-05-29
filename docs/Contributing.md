## Contributing Guide

### Prerequisites

* macOS 11+, Docker Desktop 4.26, Node 20, Python 3.12.

### Setup

```bash
git clone https://github.com/vocaria/vocaria.git
cd vocaria
pnpm install
pip install -r requirements.txt
cp .env.example .env
```

### Branching

* `main`: production
* `dev`: integration
* `feat/*`, `fix/*` feature & bug branches

### Pull Requests

* Link to Jira ticket/task ID.
* Pass CI, 90 % coverage.
* Include screenshot/GIF for UI changes.

### Commit Style

Follow Conventional Commits.

### Code Review

* At least 1 approval.
* Reviewer checks docs, tests, security impact.

### Etiquette

* English preferred in code; Spanish ok in comments for UX content.

### Contact

Open issue or email `dev@vocaria.app`.
