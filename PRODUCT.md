# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Field Survey Engineers, Instrument Operators, and Site Technicians needing rapid SOP lookup and field calculation utilities on smartphones or tablets in active outdoor/tunnel conditions.
- Geomatics / Civil Engineering Students and Academic Surveyors seeking rigorous, standards-compliant survey manuals (Two-Peg test, Bowditch compass rule, TGM2017 geoid tie-ins, TBM guidance).

## Product Purpose
MESURV is an all-in-one, high-performance web platform that bridges rigorous Thai geodetic standards with practical field workflows. It delivers instant, zero-latency field engineering SOPs, survey calculation tools (coordinate transformations, traverse adjustment, leveling sheets, Thai land area), and interactive WebGIS mapping with 100% browser-side privacy and offline resilience.

## Positioning
Unlike generic CAD software or heavy desktop GIS suites, MESURV requires zero installation, zero server login, and zero internet round-trips for calculations: it executes mathematical transformations (UTM, Indian 1975, WGS84, Bowditch, Leveling) directly on the client with full mobile touch ergonomics and precision.

## Operating Context
- Outdoor field environments (high sunlight glare, touch operation, varying mobile connectivity).
- Office data reduction and quality verification before CAD drafting.
- Desktop and mobile devices with light/dark adaptive theming.

## Capabilities and Constraints
- 100% Client-Side Computation: No server backend, no database requirement, zero data leakage of sensitive survey coordinates.
- Precise Geodetic Support: Indian 1975 datum, UTM Zones 47N/48N, WGS84, Bowditch Compass Rule traverse balancing, differential leveling collimation adjustment, Thai Land Area (Rai-Ngan-Wa).
- Deep URL Hash Routing: Single-page application deep-linking (`#/knowledge/:topicId`, `#/calculator/:subTab`, `#/map`) with native browser history integration.
- Responsive Ergonomics: Horizontal swipeable chips on mobile (< 1024px), full-width locked canvas for WebGIS, and desktop GitHub-style layout.

## Brand Commitments
- Brand Name: MESURV
- Visual Voice: Clean, modern, technical, trustworthy, and eye-friendly (sky/blue/slate palette with native light and dark modes).
- Minimalist header with direct navigation between Knowledge Hub, Tools, and WebGIS.

## Evidence on Hand
- 9 Comprehensive Engineering SOPs covering Survey Instruments, Theodolite setup, Differential Leveling, Closed-Loop Traverse, Link Traverse, GNSS RTK, UAV Photogrammetry, Terrestrial LiDAR/SLAM, Hydrographic Bathymetry, and TBM Tunnel Guidance.
- Built-in live calculation tools for coordinate transformations, traverse balancing, leveling sheets, and Thai land area.
- Leaflet WebMap integration with coordinate plotting.

## Product Principles
1. **Zero-Latency Field Readiness:** Instant loading, client-side offline execution, zero network dependence for core math and manual lookup.
2. **Mathematical & Geodetic Rigor:** Strictly align with Royal Thai Survey Department (RTSD), FGCC, and international geomatics standards.
3. **Ergonomic Clarity:** High legibility under direct sunlight, uncluttered interfaces, and seamless keyboard/touch controls.
4. **Data Privacy by Architecture:** All coordinate data, benchmark elevations, and traverse observations remain strictly inside the user's browser runtime.

## Accessibility & Inclusion
- WCAG 2.1 zoom compliance (pinch-to-zoom allowed on mobile).
- High contrast light/dark mode support with semantic color tokens.
- Keyboard navigation (e.g. `/` hotkey for search focus).
