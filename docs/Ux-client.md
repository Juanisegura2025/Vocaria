## Client Widget UX Specification

### Embed footprint

`<div id="vocaria-widget" class="fixed bottom-6 right-6 z-50">` (320 × 480 max).

### States

1. **Idle button** – Circular 56 px, icon `mic`, primary color.
2. **Listening** – Pulsating ring, tooltip “Escuchando…”.
3. **Chat drawer** – Slide‑up panel with message bubbles.

   * Agent messages left, visitor right.
   * Voice auto‑plays; text caption below.
4. **Room context banner** – If visitor cambia de ambiente, banner small top “Estás en Cocina (12 m²)”.

### Components

| Component    | Tailwind classes               | Behaviour                      |
| ------------ | ------------------------------ | ------------------------------ |
| Bubble       | `rounded-2xl px-4 py-3 shadow` | Agent bubble tinted primary‑50 |
| Hotspot card | `flex gap-2 items-center`      | Click ⇒ open Mattertag image   |
| CTA button   | `btn btn-primary w-full`       | Opens Calendly tool            |

### UX microcopy (ES)

* Greeting: “¡Hola! Soy tu guía virtual. Pregúntame sobre las dimensiones o agenda una visita.”
* Lead capture prompt: “¿Quieres que te contacte un agente humano? Déjame tu email.”

### Animations

* Drawer slide `transition-transform duration-300 ease-out`.
* Bubble fade‑in `opacity 0 → 1 250ms`.

### Accessibility

* Support screen reader via `role="dialog" aria-live="polite"`.
* Keyboard: `Esc` cierra drawer.

### Theming tokens inherited from admin panel for consistency.
