# Vocaria Design System - Master Guidelines

> **Creating a premium voice-first virtual showing assistant that inspires trust and drives conversions**

---

## 🎯 **Design Philosophy**

### **Core Principle: "Professional Simplicity"**
Vocaria empowers real estate professionals with AI-driven lead capture. Our design reflects **trust, sophistication, and efficiency** - the qualities agents need to close more deals.

### **Design Pillars:**

**🔹 Trust-First Design**
- Clean, professional aesthetics that mirror high-end real estate marketing
- Consistent visual language that builds confidence in the technology
- Subtle premium details that justify SaaS pricing

**🔹 Conversion-Optimized**
- Every UI element designed to guide users toward successful outcomes
- Clear calls-to-action with minimal cognitive load
- Data visualization that tells compelling stories

**🔹 Effortless Usability**
- Intuitive navigation requiring zero training
- Progressive disclosure of advanced features
- Mobile-first responsive design for busy agents

---

## 🎨 **Visual Identity**

### **Color Palette**

#### **Primary Colors**
```css
/* Trust Blue - Primary brand color */
--primary: #2563EB;        /* Modern, professional, tech-forward */
--primary-light: #3B82F6;  /* Hover states, accents */
--primary-dark: #1D4ED8;   /* Active states, depth */

/* Success Green - Conversions, positive metrics */
--success: #10B981;        /* Lead captures, growth indicators */
--success-light: #34D399;  /* Positive state backgrounds */

/* Warning Amber - Attention, caution */
--warning: #F59E0B;        /* Alerts, pending states */
--warning-light: #FCD34D;  /* Warning backgrounds */

/* Error Red - Problems, failures */
--error: #EF4444;          /* Errors, declined states */
--error-light: #F87171;    /* Error backgrounds */
```

#### **Neutral Scale**
```css
/* Sophisticated grays for content hierarchy */
--gray-50: #F9FAFB;        /* Background, subtle surfaces */
--gray-100: #F3F4F6;       /* Card backgrounds, dividers */
--gray-200: #E5E7EB;       /* Borders, inactive states */
--gray-300: #D1D5DB;       /* Input borders, disabled text */
--gray-400: #9CA3AF;       /* Placeholder text, icons */
--gray-500: #6B7280;       /* Secondary text, metadata */
--gray-600: #4B5563;       /* Primary text, headings */
--gray-700: #374151;       /* Dark text, emphasis */
--gray-800: #1F2937;       /* High contrast text */
--gray-900: #111827;       /* Maximum contrast, headers */
```

#### **Real Estate Accent Colors**
```css
/* Premium Gold - Luxury properties, premium features */
--gold: #D97706;
--gold-light: #FBBF24;

/* Property Blue - Property markers, maps */
--property: #0EA5E9;
--property-light: #38BDF8;
```

### **Typography**

#### **Font Stack**
```css
/* Primary: Inter - Clean, modern, highly legible */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Secondary: Manrope - Friendly, approachable for marketing copy */
--font-secondary: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace: JetBrains Mono - Code, APIs, technical data */
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### **Type Scale**
```css
/* Fluid typography scaling with viewport */
--text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);      /* 12-14px */
--text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);        /* 14-16px */
--text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);        /* 16-18px */
--text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);       /* 18-20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);        /* 20-24px */
--text-2xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem);         /* 24-30px */
--text-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem);    /* 30-36px */
--text-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);         /* 36-48px */
```

#### **Font Weights**
```css
--weight-light: 300;    /* Subtle text, captions */
--weight-normal: 400;   /* Body text, descriptions */
--weight-medium: 500;   /* Emphasized text, labels */
--weight-semibold: 600; /* Headings, important text */
--weight-bold: 700;     /* Strong emphasis, titles */
--weight-black: 900;    /* Hero text, major headings */
```

### **Spacing System**
```css
/* Consistent spacing based on 8px grid */
--space-0: 0;
--space-1: 0.25rem;     /* 4px - Tight spacing */
--space-2: 0.5rem;      /* 8px - Base unit */
--space-3: 0.75rem;     /* 12px - Small gaps */
--space-4: 1rem;        /* 16px - Standard spacing */
--space-5: 1.25rem;     /* 20px - Medium gaps */
--space-6: 1.5rem;      /* 24px - Large gaps */
--space-8: 2rem;        /* 32px - Section spacing */
--space-10: 2.5rem;     /* 40px - Major sections */
--space-12: 3rem;       /* 48px - Page sections */
--space-16: 4rem;       /* 64px - Hero spacing */
--space-20: 5rem;       /* 80px - Major separation */
--space-24: 6rem;       /* 96px - Page-level spacing */
```

---

## 🧩 **Component System**

### **Buttons**

#### **Primary Button - Main Actions**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: var(--weight-medium);
  font-size: var(--text-sm);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
```

#### **Secondary Button - Alternative Actions**
```css
.btn-secondary {
  background: white;
  color: var(--primary);
  border: 1.5px solid var(--primary);
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: var(--weight-medium);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--primary);
  color: white;
}
```

#### **Ghost Button - Subtle Actions**
```css
.btn-ghost {
  background: transparent;
  color: var(--gray-600);
  border: none;
  padding: 8px 16px;
  font-weight: var(--weight-medium);
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--gray-100);
  color: var(--gray-800);
}
```

### **Cards**

#### **Data Card - Metrics, KPIs**
```css
.card-data {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 12px;
  padding: var(--space-6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card-data:hover {
  border-color: var(--primary-light);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}
```

#### **Content Card - Information Display**
```css
.card-content {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.card-content:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
```

### **Forms**

#### **Input Fields**
```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--gray-300);
  border-radius: 8px;
  font-size: var(--text-base);
  transition: all 0.2s ease;
  background: white;
}

.input-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-field:invalid {
  border-color: var(--error);
}
```

#### **Select Dropdowns**
```css
.select-field {
  appearance: none;
  background: white url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236B7280'><path fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/></svg>") no-repeat right 12px center;
  background-size: 16px;
  padding: 12px 40px 12px 16px;
  border: 1.5px solid var(--gray-300);
  border-radius: 8px;
}
```

### **Navigation**

#### **Sidebar Navigation**
```css
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid var(--gray-200);
  height: 100vh;
  padding: var(--space-6);
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: var(--space-1);
}

.nav-item:hover {
  background: var(--gray-50);
  color: var(--gray-800);
}

.nav-item.active {
  background: var(--primary);
  color: white;
  font-weight: var(--weight-medium);
}
```

---

## 📱 **Layout Patterns**

### **Dashboard Layout**
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  background: var(--gray-50);
}

.dashboard-header {
  grid-column: 2;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: var(--space-4) var(--space-6);
}

.dashboard-content {
  grid-column: 2;
  padding: var(--space-8);
  overflow-y: auto;
}
```

### **Widget Layout**
```css
.widget-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  max-width: 400px;
  max-height: 600px;
}

.widget-trigger {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.widget-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(37, 99, 235, 0.4);
}
```

### **Responsive Breakpoints**
```css
/* Mobile First Approach */
.container {
  width: 100%;
  padding: 0 var(--space-4);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
    padding: 0 var(--space-6);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    padding: 0 var(--space-8);
  }
}

/* Large Desktop */
@media (min-width: 1440px) {
  .container {
    max-width: 1440px;
  }
}
```

---

## ⚡ **Interaction Design**

### **Animation Principles**

#### **Easing Functions**
```css
/* Natural motion curves */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

#### **Micro-interactions**
```css
/* Button Press Feedback */
.btn:active {
  transform: translateY(1px);
}

/* Loading States */
.loading {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Success Feedback */
.success-feedback {
  animation: successBounce 0.6s ease-out;
}

@keyframes successBounce {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

### **State Management**

#### **Loading States**
```css
.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

#### **Error States**
```css
.error-state {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--error-light);
  border-radius: 8px;
  padding: var(--space-4);
}
```

#### **Empty States**
```css
.empty-state {
  text-align: center;
  padding: var(--space-12);
  color: var(--gray-500);
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-4);
  opacity: 0.5;
}
```

---

## ♿ **Accessibility Standards**

### **Color Contrast**
- **Text on background:** Minimum 4.5:1 ratio (WCAG AA)
- **Large text (18px+):** Minimum 3:1 ratio
- **Interactive elements:** Minimum 3:1 ratio for borders/focus states

### **Focus Management**
```css
/* Consistent focus indicators */
.focusable:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Skip to content for screen readers */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus {
  top: 6px;
}
```

### **ARIA Labels**
```html
<!-- Descriptive labels for complex UI -->
<button aria-label="Add new property tour">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true">
  <!-- Dynamic status updates -->
</div>

<!-- Modal accessibility -->
<div role="dialog" aria-labelledby="modal-title" aria-describedby="modal-description">
  <!-- Modal content -->
</div>
```

---

## 🚀 **Implementation Guidelines**

### **CSS Architecture**
```css
/* Use CSS Custom Properties for theming */
:root {
  /* Color system */
  --primary: #2563EB;
  /* ... other variables */
}

/* Component-based organization */
/* components/button.css */
/* components/card.css */
/* layouts/dashboard.css */
/* utilities/spacing.css */
```

### **Component Development**
```typescript
// React component with design system
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  children,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

### **Windsurf Prompts for Design Implementation**

#### **Component Creation Prompt:**
```
Create a [component name] component following Vocaria design system.

DESIGN REQUIREMENTS:
- Use design tokens from our CSS variables
- Implement hover/focus states with proper animations
- Include loading and error states
- Follow accessibility guidelines (ARIA labels, focus management)
- Use TypeScript with proper interfaces

VISUAL STYLE:
- Professional, clean aesthetic for real estate SaaS
- Primary color: #2563EB
- 8px spacing grid
- Inter font family
- Smooth transitions with cubic-bezier(0.4, 0, 0.2, 1)

REFERENCE: Use our design system guidelines in docs/design-system.md
```

### **Layout Implementation Prompt:**
```
Create a [page/layout name] following Vocaria dashboard patterns.

LAYOUT REQUIREMENTS:
- Responsive grid system (mobile-first)
- Consistent spacing using design tokens
- Proper semantic HTML structure
- Loading states and error boundaries
- Accessibility compliance

VISUAL HIERARCHY:
- Clear information architecture
- Strategic use of whitespace
- Consistent component usage
- Focus on data clarity and user goals

REFERENCE: Follow dashboard layout patterns in design-system.md
```

---

## 📊 **Design Quality Checklist**

### **Before Implementing Any UI:**
- [ ] Does it follow our color palette and typography?
- [ ] Are spacing values from our 8px grid system?
- [ ] Does it have proper hover/focus/active states?
- [ ] Is contrast ratio above 4.5:1 for text?
- [ ] Are animations smooth and purposeful?
- [ ] Does it work on mobile devices?
- [ ] Are loading and error states defined?
- [ ] Is it accessible with screen readers?

### **Component Review:**
- [ ] Follows design token system
- [ ] Has proper TypeScript interfaces
- [ ] Includes all visual states
- [ ] Has smooth transitions
- [ ] Is keyboard navigable
- [ ] Has appropriate ARIA labels

---

## 🎯 **Design Goals for Each Product Area**

### **Admin Dashboard**
- **Goal:** Efficient data management and insights
- **Aesthetic:** Clean, professional, data-focused
- **Key Elements:** Tables, charts, forms, navigation
- **Success Metric:** Task completion speed

### **Embeddable Widget**
- **Goal:** Maximize lead conversion without disrupting user experience
- **Aesthetic:** Friendly, approachable, non-intrusive
- **Key Elements:** Chat interface, voice controls, property context
- **Success Metric:** Conversion rate

### **Landing Pages**
- **Goal:** Demonstrate value and drive sign-ups
- **Aesthetic:** Premium, trustworthy, results-oriented
- **Key Elements:** Hero sections, testimonials, pricing tables
- **Success Metric:** Sign-up conversion

---

**🎨 This design system ensures Vocaria maintains a premium, professional appearance that builds trust with real estate professionals while optimizing for lead conversion and user engagement.**