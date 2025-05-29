## CI/CD – GitHub Actions

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: vocaria_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      
      - name: Install Python dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Lint with Ruff
        run: ruff check src/ tests/
      
      - name: Format check with Black
        run: black --check src/ tests/
      
      - name: Type check with mypy
        run: mypy src/
      
      - name: Security check with Bandit
        run: bandit -r src/
      
      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vocaria_test
        run: |
          python scripts/migrate.py
      
      - name: Run backend tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vocaria_test
          REDIS_URL: redis://localhost:6379/1
          ELEVEN_API_KEY: ${{ secrets.ELEVEN_API_KEY }}
          MATTERPORT_API_KEY: ${{ secrets.MATTERPORT_API_KEY }}
          DEV_MOCK_ELEVEN_LABS: true
          DEV_MOCK_MATTERPORT: true
        run: |
          pytest tests/ -v --cov=src --cov-report=xml --cov-fail-under=85
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml
          token: ${{ secrets.CODECOV_TOKEN }}

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          cache-dependency-path: frontend/pnpm-lock.yaml
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: pnpm install --frozen-lockfile
      
      - name: Lint frontend
        working-directory: ./frontend
        run: |
          pnpm lint
          pnpm type-check
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: pnpm test --coverage --watchAll=false
      
      - name: Build frontend
        working-directory: ./frontend
        run: pnpm build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'
    
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: vocaria_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          cd frontend && pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        working-directory: ./frontend
        run: pnpm exec playwright install --with-deps
      
      - name: Build application
        run: |
          cd frontend && pnpm build
          python scripts/migrate.py
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vocaria_test
      
      - name: Start application
        run: |
          python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 &
          cd frontend && pnpm preview --port 3000 &
          sleep 10
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/vocaria_test
          DEV_MOCK_ELEVEN_LABS: true
          DEV_MOCK_MATTERPORT: true
      
      - name: Run E2E tests
        working-directory: ./frontend
        run: pnpm exec playwright test
        env:
          BASE_URL: http://localhost:3000
          API_URL: http://localhost:8000
      
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 30

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend, e2e-tests]
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/dev'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to Fly.io (Staging)
        if: github.ref == 'refs/heads/dev'
        uses: superfly/flyctl-actions@1.5
        with:
          args: deploy --config fly.staging.toml --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Deploy to Fly.io (Production)
        if: github.ref == 'refs/heads/main'
        uses: superfly/flyctl-actions@1.5
        with:
          args: deploy --config fly.toml --image ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Run smoke tests on deployment
        if: github.ref == 'refs/heads/main'
        run: |
          sleep 30  # Wait for deployment
          curl -f https://api.vocaria.app/health || exit 1
          curl -f https://vocaria.app || exit 1
        
      - name: Notify deployment success
        if: success() && github.ref == 'refs/heads/main'
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '✅ Vocaria deployed successfully to production'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      
      - name: Notify deployment failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: '❌ Vocaria deployment failed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  performance-test:
    runs-on: ubuntu-latest
    needs: [build-and-deploy]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        uses: grafana/setup-k6-action@v1
      
      - name: Run performance tests
        run: k6 run tests/performance/load-test.js
        env:
          BASE_URL: https://api.vocaria.app
      
      - name: Upload performance results
        uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: performance-results.json
```

### Preview Deployment Configuration

```yaml
# .github/workflows/preview.yml
name: Preview Deployment
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Fly.io Preview
        id: deploy
        uses: superfly/flyctl-actions@1.5
        with:
          args: deploy --config fly.preview.toml --build-arg COMMIT_SHA=${{ github.sha }}
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      
      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.issue.number;
            const previewUrl = `https://vocaria-pr-${prNumber}.fly.dev`;
            
            github.rest.issues.createComment({
              issue_number: prNumber,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready!\n\n**URL:** ${previewUrl}\n**Commit:** ${context.sha.substring(0, 7)}`
            });
```

### Required GitHub Secrets

Add these secrets in your GitHub repository settings:

```bash
# ElevenLabs
ELEVEN_API_KEY=your_elevenlabs_api_key

# Matterport  
MATTERPORT_API_KEY=your_matterport_api_key

# Fly.io
FLY_API_TOKEN=your_fly_api_token

# Stripe (test keys for CI)
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook

# Monitoring
CODECOV_TOKEN=your_codecov_token
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### Fly.io Configuration Files

**fly.toml (Production):**
```toml
app = "vocaria"
primary_region = "gru"

[build]
  dockerfile = "Dockerfile"

[[services]]
  http_checks = []
  internal_port = 8000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[env]
  APP_ENV = "production"
```

**fly.staging.toml:**
```toml
app = "vocaria-staging"
primary_region = "gru"
# ... same config as production
```