# Knowledge Registry & Harness² Architectural Memory

| What | Why | How | Scope |
| :--- | :--- | :--- | :--- |
| **KaTeX Survey Formula Renderer** | Raw LaTeX strings (`\frac`, `\text`, `\pm`, `\Delta`) confused users in field guides | Render with `katex.renderToString` using `htmlAndMathml`, defensive null-guards, and clean text fallback on syntax error | Knowledge Hub, SOP Guides, Calculator Math Derivations |
| **Leveling Turning Point Calculation Invariant** | Inverting BS/FS order at turning points corrupted intermediate elevations ($Elev_{TP} = HI_{prev} - FS$) | Enforce evaluating $FS$ first to update station elevation before calculating new $HI = Elev_{TP} + BS$ | `computeStadia`, Differential Leveling Core |
| **Connecting vs Closed Traverse Derivation Branching** | Unconditional polygon formula $(n-2)\times 180^\circ$ yielded nonsense $0^\circ$ errors in link traverse mode | Branch step 1 derivation between closed-loop angular misclosure and open link azimuth transfer ($\text{Az}_{forward} = \text{Az}_{back} + \theta_{obs}$) | `TraverseCalculator.tsx` |
| **Strap Beam Geometric Boundary Guard** | Eccentricity $e \ge L$ caused division by zero or negative beam spans ($L' \le 0$) | Gate equilibrium solver and math accordion behind `isInvalidGeometry` check with clear structural warning | `StrapBeamCalculator.tsx` |
| **Consolidated Survey Law Taxonomy (LAW-01..06)** | Granular single-article law items bloated UI and scattered related regulations | Grouped into 6 authoritative pillars with official Gazette citations, field surveyor guidance, and penalty alerts | `site-knowledge.ts`, `KnowledgeHub.tsx` |
