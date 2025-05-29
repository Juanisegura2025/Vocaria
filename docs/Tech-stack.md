## Tech Stack – Vocaria

### Backend

| Layer         | Tech            | Version                |
| ------------- | --------------- | ---------------------- |
| Language      | Python          | >=3.12                 |
| Framework     | FastAPI         | >=0.115                |
| Data          | PostgreSQL      | 16.x                   |
| Vector        | PGVector        | >=0.6.0                |
| Container     | Docker          | Desktop >=4.26         |
| Infra-as-Code | Terraform (AWS) | >=1.8                  |
| Testing       | Pytest          | >=8.0                  |
| Linting       | Ruff + Black    | >=0.6.0 + >=24.0      |

### Frontend

| Layer       | Tech            | Version     |
| ----------- | --------------- | ----------- |
| Runtime     | Node            | 20 LTS      |
| Package Mgr | pnpm            | >=9.0       |
| UI          | React + Vite    | >=18.3 / 5  |
| Styling     | Tailwind CSS    | >=3.4       |
| Charts      | Recharts        | >=2.12      |
| E2E         | Playwright      | >=1.48      |
| State Mgmt  | Zustand + TanStack Query | >=4.5 + >=5.0 |

### AI & External APIs

| Domain            | Provider                | SDK/Version           |
| ----------------- | ----------------------- | --------------------- |
| Conversational AI | ElevenLabs CAI          | `@elevenlabs/web` 0.3 |
| TTS/STT           | ElevenLabs Flash v2     | REST / WebSocket      |
| 3D Data           | Matterport Showcase SDK | >=3.2                 |
| Payment           | Stripe                  | `stripe` Python >=9.0 |
| GraphQL Client    | httpx + gql             | >=0.27 + >=3.0        |

### DevOps

* GitHub Actions runners `ubuntu-latest`
* Fly.io deployment for preview + prod GRU region
* Cloudflare DNS + Full Strict SSL
* Monitoring: Sentry + Grafana Cloud (free tier)
* Secrets: GitHub Secrets + Fly secrets

### Local Environment

* macOS 11+ Big Sur, Apple Silicon compatible
* Volta for Node version pinning
* direnv + python-dotenv for env vars
* Docker Desktop with BuildKit enabled

### Development Tools

| Tool              | Purpose                    | Version    |
| ----------------- | -------------------------- | ---------- |
| Pre-commit        | Git hooks                  | >=3.6      |
| Husky             | Frontend git hooks         | >=9.0      |
| ESLint            | TypeScript linting         | >=9.0      |
| Prettier          | Code formatting            | >=3.0      |
| mypy              | Python type checking       | >=1.8      |
| Bandit            | Security linting           | >=1.7      |

### Recommended VSCode Extensions

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "charliermarsh.ruff",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright"
  ]
}
```

### System Requirements

**Minimum:**
- 8GB RAM, 20GB disk space
- macOS 11+ or Ubuntu 20.04+
- Docker Desktop running

**Recommended for development:**
- 16GB RAM, 50GB disk space
- Apple Silicon Mac or Intel i7+
- Fast internet (for AI model downloads)