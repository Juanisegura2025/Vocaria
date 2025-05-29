## Security & Privacy

### Threat Model

| Asset          | Threat        | Mitigation                             |
| -------------- | ------------- | -------------------------------------- |
| Visitor PII    | Interception  | TLS 1.3, HSTS, WAF                     |
| Audio streams  | Replay attack | Signed WS tokens, exp 5 min            |
| DB credentials | Leak          | GH Secrets + Fly secrets, no hard‑code |

### Compliance

* **GDPR**: DPA + right‑to‑erasure endpoint `/gdpr/delete`.
* **LGPD (Brazil)**: Add explicit consent check box before voice capture.
* **Ley 25.326 (AR)**: Data registration with AAIP.

### Policies

* Retención de transcripciones: 90 días, borrado automático.
* Voice cloning requerirá release firmado.

### Security Controls

* OWASP ASVS level 2.
* Dependabot + Snyk scans weekly.
* CSP headers: `default-src 'self' https://*.vocaria.app`.

### Incident Response

* SLA: acknowledge in 1 h, restore in 24 h.
* Post‑mortem published within 5 días.
