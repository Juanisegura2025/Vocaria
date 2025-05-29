## Test Plan – Vocaria

### Levels

1. Unit – functions & components
2. Integration – API + DB
3. E2E – user flows (Cypress/Playwright)

### Matrix

| ID     | Feature                   | Type        | Scenario                    | Priority | Tool             |
| ------ | ------------------------- | ----------- | --------------------------- | -------- | ---------------- |
| UT-01  | GraphQL client            | Unit        | Returns dimension estimates | High     | Pytest           |
| UT-02  | Lead model                | Unit        | Validates email format      | Med      | Pytest           |
| IN-01  | POST /leads               | Integration | Creates row & returns 201   | High     | Pytest + Test DB |
| IN-02  | Stripe webhook            | Integration | Updates billing status      | High     | Pytest           |
| E2E-01 | Visitor chat flow         | E2E         | Ask price → capture lead    | High     | Playwright       |
| E2E-02 | Admin login & create tour | E2E         | Flow happy path             | Med      | Playwright       |

### Non‑functional tests

| ID      | Metric            | Target     | Tool         |
| ------- | ----------------- | ---------- | ------------ |
| PERF-01 | P95 voice latency | ≤1.2 s     | k6 + Grafana |
| SEC-01  | OWASP scan        | 0 critical | OWASP ZAP    |

### CI Gate

* Unit & integration must pass 100 %.
* E2E smoke must pass on `main`.
* Performance test nightly.
