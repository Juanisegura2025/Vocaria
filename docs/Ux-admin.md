## Admin Panel UX Specification

### Design tokens

| Token      | Light     | Dark      |
| ---------- | --------- | --------- |
| Primary    | `#2563eb` | `#4f83ff` |
| Background | `#f9fafb` | `#0f172a` |
| Surface    | `#ffffff` | `#1e293b` |
| Error      | `#dc2626` | `#f87171` |

### Layout

* **Navbar left (64 px)** – icon + text labels.
* **Header bar (56 px)** – breadcrumb + quick actions.
* **Content grid** – `max-w-7xl`, padding `px-6 py-8`.
* **Cards** – rounded‑2xl, shadow‑md, gap‑6.

### Core screens

1. **Dashboard** – KPIs (total leads, minutes TTS, active tours) as Recharts line + bar. Skeleton shimmer on load.
2. **Tour list** – Table with columns *Name*, *Model ID*, *Agent Status*, *Usage*, *Created*. Row click ⇒ details.
3. **Tour details** – Tabs: *Overview*, *Leads*, *Settings*.

   * Overview: Hero 360º thumbnail, usage donut, last 10 conversations accordion.
   * Leads: Data grid editable, export CSV.
4. **Billing** – Stripe customer portal embedded via iframe modal.

### Accessibility

* All interactive elements reachable via `Tab` order.
* `aria-labelledby` on modals; focus trap.
* Contrast AA enforced via Tailwind plugin.

### Animations

* Framer Motion fade‑in for cards (`duration 0.35s`).

### Error states

* Empty tours ⇒ illustration + CTA "Crear primer tour".
* Network error toast with retry.

### Responsive

* Breakpoints `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
* Mobile: Navbar collapses to bottom bar icons.
