# Beam Lab

**Beam Lab** is a high-precision, interactive, browser-based structural beam analysis application built with React, TypeScript, Vite, and SVG visual diagrams. It performs exact analytical Euler-Bernoulli beam calculations locally in the browser with zero external backend dependencies or paid APIs.

> ⚠️ **EDUCATIONAL USE ONLY WARNING**
>
> **Beam Lab is strictly an educational tool and engineering calculator demonstration. It is NOT certified for structural engineering design, construction documents, or safety-critical applications.**

---

## Sign Conventions

Beam Lab adheres strictly to standard structural mechanics sign conventions:
- **X-Axis:** Measured positive from left boundary ($x = 0$) to right boundary ($x = L$).
- **Vertical Force / Shear Force ($V$):** Positive upwards forces ($+y$). Positive shear produces a clock-wise rotation on an element ($V = -dV/dx$ integration convention).
- **Bending Moment ($M$):** Positive counter-clockwise couple / moment causing tension on bottom fibers (sagging moment positive).
- **Deflection ($\delta$ or $v$):** Positive upwards ($+y$). Downward deflection is negative.

---

## Feature Comparison: Implemented MVP vs. Deferred Roadmap

### ✅ Implemented MVP Features
- **Pure Analytical Solver Engine:** Separated pure TypeScript Euler-Bernoulli solver executing exact piecewise integrations (not coarse sampled or fake chart data).
- **Boundary Configurations:**
  - Simply Supported (Pin at $x=0$, Roller at $x=L$)
  - Cantilever (Fixed at $x=0$, Free at $x=L$)
- **Flexible Load Cases:**
  - Point Forces (at any $0 \le x \le L$)
  - Point Couples / Moments (at any $0 \le x \le L$)
  - Uniform, Triangular, and Trapezoidal Distributed Loads over arbitrary valid intervals $[x_1, x_2]$.
- **Consistent Unit Support:** Input in m, GPa, mm⁴, kN, kN/m, kNm; normalized internally to standard SI units (m, Pa, m⁴, N, N/m, Nm).
- **Exact Discontinuities & Extrema:** Explicit tracking of left ($x^-$) and right ($x^+$) values at point loads, couples, and interval boundaries; exact analytical derivative root-finding for shear, moment, and deflection extrema.
- **Interactive SVG UI Canvas:** Drag-to-position for point loads, visual support symbols, load arrows and trapezoids, real-time hover value crosshairs, and zero baselines.
- **Hand-Calculation Mode:** Step-by-step breakdown showing static equilibrium equations, boundary conditions, integration constants, and governing piecewise equations.
- **Data & Persistence:** Real-time validation, stale-results visual indicator, JSON model import/export with schema validation, `localStorage` persistence, and CSV export for diagram data.
- **Printable Report:** Media print styling formatted for clean engineering report printouts.

### ❌ Deferred / Roadmap Features (NOT Implemented in MVP)
- General multi-span continuous supports, intermediate roller supports, spring supports, or internal hinges.
- Cross-section geometry library (I-beams, hollow tubes, channels) and self-weight automatic calculation.
- Load combination factors (ASCE 7, Eurocode load cases).
- Combined stress distribution (bending + shear stress) and 3D visualization.
- Structural code compliance checks (AISC / Eurocode capacity ratios) or automated design optimization.
- Server-side backend API calculation or PDF report export (uses native print styling instead).

---

## Getting Started & Development

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm test

# Type-check TypeScript code
npm run typecheck

# Build production distribution
npm run build
```
