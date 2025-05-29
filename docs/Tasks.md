## Vocaria Task Checklist

### Sprint 0 – Bootstrap (Semana 1)

* [ ] **Init repo & CI skeleton**
  *Test:* `pytest tests/smoke/test_project_structure.py`
  *Commit:* `chore(repo): initialize monorepo structure`
* [ ] **Environment secrets (ElevenLabs, Stripe, Matterport)**
  *Test:* `python scripts/validate_env.py`
  *Commit:* `feat(env): add environment validation and secrets`
* [ ] **DNS & HTTPS vocaria.app**
  *Test:* `curl -I https://vocaria.app | grep strict-transport-security`
  *Commit:* `feat(infra): cloudflare dns + ssl configuration`

### Sprint 1 – Widget mínimo (Semana 2)

* [ ] **Embed CAI widget**
  *Test:* `playwright test tests/e2e/widget-embed.spec.ts`
  *Commit:* `feat(widget): initial embed with CAI handshake`
* [ ] **Showcase SDK room event**
  *Test:* `playwright test tests/e2e/room-navigation.spec.ts`
  *Commit:* `feat(widget): room-enter listener integration`
* [ ] **GraphQL dimension fetcher**
  *Test:* `pytest tests/unit/test_matterport_client.py`
  *Commit:* `feat(api): matterport graphql dimension client`

### Sprint 2 – Backend Core (Semana 3)

* [ ] **FastAPI voice_router endpoints**
  *Test:* `pytest tests/unit/test_voice_router.py`
  *Commit:* `feat(api): voice router websocket handler`
* [ ] **Lead service & PostgreSQL schema**
  *Test:* `pytest tests/integration/test_leads_service.py`
  *Commit:* `feat(db): leads service and database schema`
* [ ] **Stripe webhook handler**
  *Test:* `pytest tests/integration/test_stripe_webhooks.py`
  *Commit:* `feat(billing): stripe webhook processing`

### Sprint 3 – Admin Panel MVP (Semana 4)

* [ ] **Dashboard tours list**
  *Test:* `npm test -- --testPathPattern=tours-list`
  *Commit:* `feat(admin): tours list dashboard component`
* [ ] **Usage metrics & charts**
  *Test:* `npm test -- --testPathPattern=usage-charts`
  *Commit:* `feat(admin): usage analytics with recharts`
* [ ] **User authentication system**
  *Test:* `playwright test tests/e2e/auth-flow.spec.ts`
  *Commit:* `feat(auth): jwt authentication system`

### Sprint 4 – Integration & Testing (Semana 5)

* [ ] **End-to-end conversation flow**
  *Test:* `playwright test tests/e2e/complete-conversation.spec.ts`
  *Commit:* `feat(integration): complete visitor conversation flow`
* [ ] **Performance optimization**
  *Test:* `k6 run tests/performance/load-test.js`
  *Commit:* `perf(api): optimize voice router latency`
* [ ] **Security audit & fixes**
  *Test:* `bandit -r backend/ && npm audit`
  *Commit:* `security(app): address security vulnerabilities`

### Sprint 5 – Beta & Feedback (Semana 6)

* [ ] **Private beta deployment**
  *Test:* Manual validation with 3 beta users
  *Commit:* `deploy(beta): production deployment for beta testing`
* [ ] **Analytics implementation**
  *Test:* Validate GA4 events in console
  *Commit:* `feat(analytics): user behavior tracking`
* [ ] **Pricing tier validation**
  *Test:* Test Stripe subscriptions in sandbox
  *Commit:* `feat(billing): subscription management system`

### Sprint 6 – Public Launch (Semanas 7-8)

* [ ] **Product Hunt preparation**
  *Test:* N/A (Marketing assets)
  *Commit:* `docs(marketing): product hunt launch assets`
* [ ] **Production Stripe integration**
  *Test:* Live transaction test with $1.00
  *Commit:* `feat(billing): production payment processing`
* [ ] **Monitoring & alerting**
  *Test:* Trigger test alerts
  *Commit:* `feat(monitoring): sentry and grafana integration`

---

## Test Commands Reference

### Backend Tests
```bash
# All tests
pytest

# Unit tests only  
pytest tests/unit/ -v

# Integration tests (requires test DB)
pytest tests/integration/ -v

# Smoke tests (basic functionality)
pytest tests/smoke/ -v

# Coverage report
pytest --cov=src --cov-report=html
```

### Frontend Tests
```bash
# Unit tests
npm test -- --watchAll=false

# E2E tests
npx playwright test

# E2E tests with UI
npx playwright test --ui

# Specific test file
npx playwright test tests/e2e/widget-embed.spec.ts
```

### Environment Validation
```bash
# Check all required environment variables
python scripts/validate_env.py

# Test API connections
python scripts/test_connections.py

# Lint environment file
python scripts/lint_env.py
```

### Performance Tests
```bash
# Load test with k6
k6 run tests/performance/load-test.js

# Stress test voice endpoints
k6 run tests/performance/voice-stress.js
```

## Definition of Done Checklist

For each task to be considered complete:

- [ ] **Code written** following coding-guidelines.md
- [ ] **Tests passing** (unit + integration where applicable)
- [ ] **Code reviewed** by at least 1 person (or AI validation)
- [ ] **Documentation updated** if API changes
- [ ] **Security check** passed (no high/critical issues)
- [ ] **Performance validated** (meets NFR requirements)
- [ ] **Deployed to staging** and smoke tested
- [ ] **Conventional commit** message used
- [ ] **CI/CD pipeline** green

## Emergency Rollback Plan

If any sprint deployment fails:

1. **Immediate**: Rollback via `fly deploy --image previous-image`
2. **Investigate**: Check logs in Grafana + Sentry
3. **Hotfix**: Create `hotfix/sprint-X-issue` branch
4. **Re-deploy**: After validation in staging
5. **Post-mortem**: Document in `docs/incidents/`

## Sprint Review Template

After each sprint, document:

```markdown
## Sprint X Review

### Completed Tasks
- [ ] Task A - On time
- [x] Task B - 2 days delay

### Metrics Achieved
- Test coverage: X%
- Performance: X ms p95
- Bug count: X critical, X minor

### Lessons Learned
- What went well
- What to improve
- Blockers encountered

### Next Sprint Adjustments
- Priority changes
- Resource allocation
- Risk mitigation
```